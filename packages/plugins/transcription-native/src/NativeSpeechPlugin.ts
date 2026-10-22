/// <reference path="./speech-recognition.d.ts" />
//
// The triple-slash reference above is load-bearing: when `apps/web` (or any other
// package) imports this file, its TS program would otherwise not load the sibling
// ambient declarations, and `SpeechRecognition` would be an unknown name.
import { appendTranscript } from "@personal-log/plugin-api";
import type { LiveTranscriptionPlugin } from "@personal-log/plugin-api";
import { NativeSpeechUnsupportedError } from "./NativeSpeechUnsupportedError.js";

type StartLiveOptions = Parameters<LiveTranscriptionPlugin["startLive"]>[0];

// The engine re-delivers already-known text at session boundaries (an internal
// restart re-emits the previous tail; silence re-finalizes a result with fuller
// text). Inside the run the segment map removes that exactly, so the boundary
// fold trims any overlap with the committed tail — no length threshold.
const REDELIVERY_MIN_OVERLAP = 1;

export class NativeSpeechPlugin implements LiveTranscriptionPlugin {
  readonly id = "native-speech";
  readonly name = "Native speech recognition (Web Speech API)";

  private speechConstructor(): SpeechRecognitionConstructor | undefined {
    return window.SpeechRecognition ?? window.webkitSpeechRecognition;
  }

  capabilities() {
    const supported = this.speechConstructor() !== undefined;
    // Honest reporting only: what the browser exposes via SpeechRecognition.
    // There is no way to *verify* local/offline processing from this API yet,
    // so we do not claim false positives. Enforcement arrives in a later
    // work item.
    return { live: supported, local: false, offline: false, languages: [] };
  }

  async initialize() {
    // Native plugin needs no configuration yet.
  }

  async dispose() {
    // No persistent resources yet.
  }

  async startLive(options?: StartLiveOptions) {
    const Ctor = this.speechConstructor();
    if (!Ctor) {
      throw new NativeSpeechUnsupportedError();
    }

    const speech = new Ctor();
    speech.continuous = true;
    speech.interimResults = true;
    if (options?.language) {
      speech.lang = options.language;
    }

    let active = true;
    // Finals already folded into the emitted text — everything settled before
    // the last recognition restart. Re-delivered tails get trimmed against it.
    let committed = "";
    // Finals of the current recognition run, keyed by result index. The engine
    // can re-finalize the same index on silence with fuller text (the longer
    // refinement replaces the stored segment) and re-delivers a tail verbatim
    // after an internal restart (identical re-delivery is dropped).
    const segments = new Map<number, string>();
    let onPartial: ((text: string) => void) | undefined;
    let onFinal: ((text: string) => void) | undefined;
    // Last text handed to onFinal — the engine re-emits unchanged totals
    // (identical re-finalized results), and listeners should not hear a no-op.
    let lastEmitted: string | undefined;

    const joinedSegments = () =>
      [...segments.keys()]
        .sort((a, b) => a - b)
        .map((index) => segments.get(index)!.trim())
        .filter((text) => text !== "")
        .join(" ");

    // Folds the current run's finals into the committed text and forgets them,
    // trimming any overlap (a restart re-delivered tail is already committed).
    const commit = () => {
      committed = appendTranscript(committed, joinedSegments(), REDELIVERY_MIN_OVERLAP);
      segments.clear();
      return committed;
    };

    speech.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          const previous = segments.get(i);
          // Re-delivery: same or shorter restatement of a final already on
          // record. A longer restatement is a refinement — it replaces.
          const reDelivery =
            previous !== undefined &&
            text.startsWith(previous) &&
            text.length <= previous.length;
          if (!reDelivery) {
            segments.set(i, text);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim !== "" && onPartial) onPartial(interim);
      const joined = joinedSegments();
      if (joined !== "") {
        const sessionText =
          committed === ""
            ? joined
            : appendTranscript(committed, joined, REDELIVERY_MIN_OVERLAP);
        if (sessionText !== lastEmitted) {
          lastEmitted = sessionText;
          if (onFinal) onFinal(sessionText);
        }
      }
    };
    speech.onend = () => {
      if (active) {
        // Chrome ends the recognition on silence and re-delivers the last
        // segment when the same object restarts, so the tail is settled and
        // committed — the next run's re-delivery gets trimmed against it.
        commit();
        speech.start();
      }
    };
    speech.start();

    return {
      onPartialResult(callback: (text: string) => void) {
        onPartial = callback;
      },
      onFinalResult(callback: (text: string) => void) {
        onFinal = callback;
      },
      async stop() {
        active = false;
        speech.stop();
        return { text: commit() };
      },
    };
  }
}