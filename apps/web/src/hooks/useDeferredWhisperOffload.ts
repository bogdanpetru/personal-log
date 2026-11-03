import { useEffect, useRef } from "react";
import { whisperTranscriber } from "@/lib/transcription/whisperTranscriber";
import type { TranscriptionEngine } from "@/lib/transcription/TranscriptionEngine";

export function useDeferredWhisperOffload(engine: TranscriptionEngine): void {
  const armed = useRef(false);
  const visitedWhisper = useRef(false);

  useEffect(() => {
    if (engine === "whisper") {
      visitedWhisper.current = true;
      armed.current = false;
      return;
    }
    if (visitedWhisper.current) {
      armed.current = true;
    }
  }, [engine]);

  useEffect(
    () => () => {
      if (armed.current) {
        armed.current = false;
        void whisperTranscriber.offload();
      }
    },
    [],
  );
}
