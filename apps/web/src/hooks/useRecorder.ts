import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording";

interface UseRecorder {
  status: RecorderStatus;
  transcript: string;
  partial: string;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useRecorder(): UseRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.SpeechRecognition !== undefined ||
      window.webkitSpeechRecognition !== undefined
    );
  });

  const statusRef = useRef<RecorderStatus>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef("");

  const start = async () => {
    if (statusRef.current === "recording" || !supported) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start();

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return;
    }
    const instance = new SpeechRecognitionCtor();
    recognitionRef.current = instance;
    instance.continuous = true;
    instance.interimResults = true;
    instance.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTextRef.current += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTextRef.current.trimEnd());
      setPartial(interim);
    };
    instance.onend = () => {
      if (statusRef.current === "recording") {
        instance.start();
      }
    };
    instance.start();

    statusRef.current = "recording";
    setStatus("recording");
  };

  const stop = () => {
    if (statusRef.current !== "recording") {
      return;
    }
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    statusRef.current = "idle";
    setStatus("idle");
    setPartial("");
  };

  return { status, transcript, partial, supported, start, stop };
}
