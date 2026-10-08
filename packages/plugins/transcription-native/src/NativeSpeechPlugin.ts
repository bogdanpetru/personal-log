/// <reference path="./speech-recognition.d.ts" />
//
// The triple-slash reference above is load-bearing: when `apps/web` (or any other
// package) imports this file, its TS program would otherwise not load the sibling
// ambient declarations, and `SpeechRecognition` would be an unknown name.
import type { LiveTranscriptionPlugin } from "@personal-log/plugin-api";
import { NativeSpeechUnsupportedError } from "./NativeSpeechUnsupportedError.js";

type StartLiveOptions = Parameters<LiveTranscriptionPlugin["startLive"]>[0];

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
    let finalText = "";
    let onPartial: ((text: string) => void) | undefined;
    let onFinal: ((text: string) => void) | undefined;

    speech.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim !== "" && onPartial) onPartial(interim);
      if (finalText !== "" && onFinal) onFinal(finalText.trimEnd());
    };
    speech.onend = () => {
      if (active) {
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
        return { text: finalText.trimEnd() };
      },
    };
  }
}
