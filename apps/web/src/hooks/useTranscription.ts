import { useMemo, useRef, useState } from "react";
import { defaultTranscriptionPlugin } from "@/lib/plugins";

interface UseTranscription {
  transcript: string;
  partial: string;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useTranscription(): UseTranscription {
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const supported = useMemo(
    () => defaultTranscriptionPlugin.capabilities().live,
    [],
  );

  const stopRef = useRef<(() => Promise<unknown>) | null>(null);

  const start = async () => {
    const session = await defaultTranscriptionPlugin.startLive();
    session.onFinalResult((text) => {
      setTranscript(text);
    });
    session.onPartialResult((text) => {
      setPartial(text);
    });
    stopRef.current = () => session.stop();
  };

  const stop = () => {
    if (!stopRef.current) return;
    void stopRef.current();
    stopRef.current = null;
    setPartial("");
  };

  return { transcript, partial, supported, start, stop };
}
