import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording";

interface UseRecorder {
  status: RecorderStatus;
  start: () => Promise<void>;
  stop: () => void;
}

export function useRecorder(): UseRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");

  const statusRef = useRef<RecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    if (statusRef.current === "recording") {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start();

    statusRef.current = "recording";
    setStatus("recording");
  };

  const stop = () => {
    if (statusRef.current !== "recording") {
      return;
    }
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    statusRef.current = "idle";
    setStatus("idle");
  };

  return { status, start, stop };
}
