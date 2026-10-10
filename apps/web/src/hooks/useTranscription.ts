import { useMemo, useRef, useState } from "react";
import type { TranscriptionOptions } from "@personal-log/plugin-api";
import { defaultTranscriptionPlugin } from "@/lib/plugins";

interface UseTranscription {
  transcript: string;
  partial: string;
  supported: boolean;
  start: (options?: TranscriptionOptions) => Promise<void>;
  stop: () => void;
  resume: () => Promise<void>;
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
      const base = baseRef.current;
      setTranscript(base === "" ? text : `${base} ${text}`);
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

  return { transcript, partial, supported, start, stop, resume };
}