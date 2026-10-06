# PL-1 — Basic app

## Goal

Open the app and see a single button labeled "Start". Click it: the app records audio and transcribes live — the button switches to "Listening", a small "recording" text appears, and the transcription renders underneath the button while speaking. Click again to stop: the indicator disappears and the transcription stays on screen.

## Tech stack

- **App:** the PL-0 scaffold (Vite + React + TypeScript, Tailwind, shadcn/ui `Button`, zustand)
- **Audio recording:** `MediaRecorder` on a `getUserMedia` stream (in memory only)
- **Transcription:** browser `SpeechRecognition` (Web Speech API), live, with interim results
- **State:** a zustand `recorder` store

## Scope

Bare bones, everything in memory and lost on refresh — later work items add storage, plugins, pause/resume, capability detection, and the rest.

- One screen, one button with two states: **Start** / **Listening**
- A "recording" text shown while recording, gone when stopped
- Live transcription (final text plus interim text in a muted color) rendered under the button
- Audio is recorded via `MediaRecorder` while listening; it is not persisted or played back yet
- The button is disabled when `SpeechRecognition` is unavailable (e.g. jsdom, unsupported browsers)

## References

- `features/braindump/product.md`
- `features/braindump/arhitecture.md` (§2 recording, §5–6 Web Speech API)
- `features/PL-0-scaffolding/spec.md`
