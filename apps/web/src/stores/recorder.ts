import { create } from "zustand";

type RecorderStatus = "idle" | "recording";

interface RecorderState {
  status: RecorderStatus;
  transcript: string;
  partial: string;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

const SpeechRecognitionCtor =
  typeof window === "undefined"
    ? undefined
    : window.SpeechRecognition ?? window.webkitSpeechRecognition;

let recognition: SpeechRecognition | null = null;
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let finalText = "";

export const useRecorder = create<RecorderState>((set, get) => ({
  status: "idle",
  transcript: "",
  partial: "",
  supported: SpeechRecognitionCtor !== undefined,
  start: async () => {
    if (get().status === "recording" || SpeechRecognitionCtor === undefined) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    const instance = new SpeechRecognitionCtor();
    recognition = instance;
    instance.continuous = true;
    instance.interimResults = true;
    instance.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }
      set({ transcript: finalText.trimEnd(), partial: interim });
    };
    instance.onend = () => {
      if (get().status === "recording") {
        instance.start();
      }
    };
    instance.start();
    set({ status: "recording" });
  },
  stop: () => {
    if (get().status !== "recording") {
      return;
    }
    recognition?.stop();
    mediaRecorder?.stop();
    mediaStream?.getTracks().forEach((track) => track.stop());
    set({ status: "idle", partial: "" });
  },
}));
