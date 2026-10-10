import { useEffect, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "paused";

interface UseRecorder {
  /** Object URL of the last completed recording, playable until discarded. */
  recording: string | null;
  /** Elapsed active recording time in whole seconds, paused time excluded. */
  seconds: number;
  status: RecorderStatus;
  start: () => Promise<void>;
  stop: () => void;
  discardRecording: () => void;
  pause: () => void;
  resume: () => void;
}

export function useRecorder(): UseRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [recording, setRecording] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const statusRef = useRef<RecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef<string | null>(null);
  // Milliseconds of active recording before the current unbroken run.
  const elapsedMsRef = useRef(0);
  // When the current unbroken run started; null while paused.
  const runStartRef = useRef<number | null>(null);

  const checkpointRun = () => {
    if (runStartRef.current !== null) {
      elapsedMsRef.current += Date.now() - runStartRef.current;
      runStartRef.current = null;
    }
  };

  // Ticks only while actively recording. The pause/resume edges are the
  // status-change edges: leaving "recording" checkpoints the elapsed time so
  // the total freezes, entering it starts a fresh unbroken run.
  useEffect(() => {
    if (status !== "recording") {
      return;
    }
    runStartRef.current = Date.now();
    const interval = window.setInterval(() => {
      const started = runStartRef.current;
      if (started !== null) {
        setSeconds(
          Math.floor((elapsedMsRef.current + (Date.now() - started)) / 1000),
        );
      }
    }, 250);
    return () => {
      checkpointRun();
      window.clearInterval(interval);
    };
  }, [status]);

  const discardRecording = () => {
    if (recordingRef.current !== null) {
      URL.revokeObjectURL(recordingRef.current);
      recordingRef.current = null;
    }
    setRecording(null);
  };

  const start = async () => {
    if (statusRef.current !== "idle") {
      return;
    }
    // Starting a new recording resets everything: the previous playback goes
    // away, the timer goes back to zero, and nothing from the last session
    // survives.
    discardRecording();
    elapsedMsRef.current = 0;
    setSeconds(0);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    // Chunks are captured per recorder instance, so a fast stop→start can
    // never mix two sessions.
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      // Pauses are excluded from the capture, so the blob covers speech only.
      if (chunks.length > 0) {
        const url = URL.createObjectURL(
          new Blob(chunks, { type: recorder.mimeType || undefined }),
        );
        recordingRef.current = url;
        setRecording(url);
      }
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start(1000);

    statusRef.current = "recording";
    setStatus("recording");
  };

  const stop = () => {
    if (statusRef.current === "idle") {
      return;
    }
    // onstop builds the blob and closes the mic track afterwards.
    mediaRecorderRef.current?.stop();
    statusRef.current = "idle";
    setStatus("idle");
  };

  const pause = () => {
    if (statusRef.current !== "recording") {
      return;
    }
    mediaRecorderRef.current?.pause();
    statusRef.current = "paused";
    setStatus("paused");
  };

  const resume = () => {
    if (statusRef.current !== "paused") {
      return;
    }
    mediaRecorderRef.current?.resume();
    statusRef.current = "recording";
    setStatus("recording");
  };

  return {
    recording,
    seconds,
    status,
    start,
    stop,
    discardRecording,
    pause,
    resume,
  };
}