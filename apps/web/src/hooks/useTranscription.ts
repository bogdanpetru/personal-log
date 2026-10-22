import { useMemo, useRef, useState } from "react";
import { appendTranscript } from "@personal-log/plugin-api";
import type { TranscriptionOptions } from "@personal-log/plugin-api";
import { defaultTranscriptionPlugin } from "@/lib/plugins";

interface UseTranscription {
  transcript: string;
  partial: string;
  supported: boolean;
  start: (options?: TranscriptionOptions) => Promise<void>;
  stop: () => void;
  resume: () => Promise<void>;
  /** Appends a line break so the next session continues on a fresh line. */
  newParagraph: () => void;
}

export function useTranscription(): UseTranscription {
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const supported = useMemo(
    () => defaultTranscriptionPlugin.capabilities().live,
    [],
  );

  const stopSessionRef = useRef<(() => Promise<unknown>) | null>(null);
  // Text accumulated before the currently running recognition session. Every
  // session reports its own accumulated final text, so appending across
  // pause/resume boundaries needs the pre-session text as the base.
  const baseRef = useRef("");
  // Options of the current recording; resume() reuses them, so the language
  // never switches live mid-recording (spec PL-4).
  const optionsRef = useRef<TranscriptionOptions | undefined>(undefined);

  const beginSession = async () => {
    const session = await defaultTranscriptionPlugin.startLive(optionsRef.current);
    session.onFinalResult((text) => {
      // The interim text being committed disappears, so it cannot linger next
      // to the committed double of itself.
      setPartial("");
      // The shared append also trims a tail the engine repeats at the session
      // boundary, and joins directly after a pause-inserted line break.
      setTranscript(appendTranscript(baseRef.current, text));
    });
    session.onPartialResult((text) => {
      setPartial(text);
    });
    stopSessionRef.current = () => session.stop();
  };

  const start = async (options?: TranscriptionOptions) => {
    optionsRef.current = options;
    baseRef.current = "";
    setTranscript("");
    setPartial("");
    await beginSession();
  };

  // Ends the recognition session only. Keeps the accumulated transcript —
  // used for pausing a live recording and for stopping it entirely.
  const stop = () => {
    if (!stopSessionRef.current) return;
    void stopSessionRef.current();
    stopSessionRef.current = null;
    setPartial("");
  };

  const resume = async () => {
    baseRef.current = transcript;
    await beginSession();
  };

  // A pause starts a new paragraph: the break lands at the end of the
  // transcript (only when there is text to break off) and resumed speech
  // continues below it.
  const newParagraph = () => {
    setTranscript((current) => (current === "" ? current : `${current}\n`));
  };

  return { transcript, partial, supported, start, stop, resume, newParagraph };
}