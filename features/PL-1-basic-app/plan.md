# PL-1 — Plan

## Goal

Basic record + live-transcribe screen. Done = `pnpm build` and `pnpm test` pass, and in the preview browser a user can click **Start**, speak, see the button become **Listening** plus a "recording" indicator, watch the transcription appear under the button, click again to stop, and see the indicator disappear while the transcription remains.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.

## Steps

### 1. [x] SpeechRecognition type declarations

Create `apps/web/src/types/speech-recognition.d.ts` (the TS DOM lib does not ship these types):

```ts
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
```

Done when: `pnpm -C apps/web build` passes.

### 2. [x] Recorder store

Create `apps/web/src/stores/recorder.ts`:

```ts
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
```

Done when: `pnpm -C apps/web build` passes.

### 3. [x] New App screen

Replace `apps/web/src/App.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/stores/recorder";

export default function App() {
  const { status, transcript, partial, supported, start, stop } =
    useRecorder();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {status === "recording" && (
        <p className="animate-pulse text-sm text-red-500">recording</p>
      )}
      <Button
        onClick={() => (status === "recording" ? stop() : void start())}
        disabled={!supported}
      >
        {status === "recording" ? "Listening" : "Start"}
      </Button>
      {(transcript !== "" || partial !== "") && (
        <p className="max-w-prose whitespace-pre-wrap text-center">
          {transcript}
          {partial !== "" && (
            <span className="text-muted-foreground"> {partial}</span>
          )}
        </p>
      )}
    </main>
  );
}
```

Delete the now-unused scaffold store:

```bash
rm apps/web/src/stores/hello.ts
```

Done when: `pnpm -C apps/web build` passes.

### 4. [x] Update the smoke test

Replace `apps/web/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the start button", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
});

test("shows no recording indicator before recording", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});
```

Done when: `pnpm -C apps/web test` passes with 2 tests.

### 5. [x] Full verification

```bash
pnpm install
pnpm build
pnpm test
```

Then start the preview server in the background and check it serves:

```bash
nohup pnpm preview >/tmp/pl1-preview.log 2>&1 &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/
```

Then hand this browser checklist to the user (microphone cannot be verified by curl):

- Open the preview URL, allow the microphone permission prompt
- Button shows **Start**; click it → button becomes **Listening**, "recording" text appears
- Speak → words appear under the button (interim words muted, then finalized)
- Click **Listening** → recording indicator disappears, transcription stays
- Reload → everything is gone (expected: nothing is stored yet)

### 6. [x] Commit

```bash
git add -A
git commit -m "PL-1: basic record + live transcription app"
```

Done when: `git log --oneline` shows the commit.

### 7. [x] Final checkbox pass

Re-read this plan and mark any remaining completed steps `[x]`.

Done when: all checkboxes in this file are `[x]`.
