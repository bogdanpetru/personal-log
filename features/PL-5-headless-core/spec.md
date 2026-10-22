# PL-5 — Headless `PersonalLog` core (no UI package)

## Goal

Extract the heart of the application into a headless library, `@personal-log/core`.
The library is UI-agnostic and dependency-injected: it receives its
collaborators through the constructor and exposes commands, events, and
queries. Any app builds its own UI on top of it. **There is no UI package** —
`apps/web` stays and consumes the core, keeping its existing components and
styling unchanged.

## Tech stack

- **Language:** TypeScript, pnpm workspace (unchanged).
- **New package:** `@personal-log/core` (`packages/core`) — plain TypeScript, no
  React, no external dependencies beyond `@personal-log/plugin-api`. It holds
  only the orchestrator (`PersonalLog`) and its state/event types — **no
  default plugin implementations**.
- **Existing packages:** `@personal-log/plugin-api` gains the recorder/storage
  interfaces and the log data model; `@personal-log/plugin-transcription-native`
  is unchanged.
- **Every plugin is a separate package:**
  - `@personal-log/plugin-recorder-media` — the browser MediaRecorder recorder;
  - `@personal-log/plugin-storage-indexeddb` — local persistence via IndexedDB;
  - `@personal-log/plugin-transcription-native` — live Web Speech transcription.
  The core depends on none of them; apps compose the plugins they need.

## The API contract

```ts
const personalLog = new PersonalLog({
  recorder, // required — the audio source (e.g. MediaRecorderRecorder)
  transcriber, // optional; absent → record-only mode
  storage, // optional; absent → logs are not persisted, getRecordings() is []
});

// Commands
personalLog.record(); // start a new log (no-op unless idle)
personalLog.pause();
personalLog.resume(); // transcription resumes first; on failure stays paused
personalLog.stop(); // ends recorder + transcription; saves the log; emits "recorded"

// Configuration & queries
personalLog.setLanguage("de-DE"); // used by the next record()
personalLog.getState(); // { status, seconds, transcript, partial }
personalLog.getRecordings(); // Promise<Log[]> from storage
personalLog.deleteRecording(id);
personalLog.isTranscriptionSupported(); // transcriber?.capabilities().live
personalLog.dispose();

// Events — on() returns an unsubscribe function
personalLog.on("state", (state) => {}); // every state change (status, timer, transcript)
personalLog.on("recorded", (log) => {}); // stop completed; log saved to storage
personalLog.on("discarded", (recording) => {}); // empty transcript → nothing kept
personalLog.on("error", (error) => {});
```

## Scope

- **`@personal-log/plugin-api`** — new interfaces and data model (from the
  braindump):
  - `Recorder` (`start/pause/resume/stop → Recording { blob }`) and
    `StoragePlugin` (`initialize/save/get/list/delete/dispose`);
  - `Log` (id, createdAt, durationMs, audio, transcriptions),
    `AudioArtifact`, `TranscriptionArtifact`, `LogId`. The audio artifact
    carries the `Blob`; transcription artifacts reference the log and name the
    provider — derived data, never the source of truth.
- **`@personal-log/core`**
  - `PersonalLog` — the orchestrator. Owns the session state machine
    (`idle | recording | paused`; after `stop()` the status returns to `idle`
    and the completed log is delivered via `recorded`/`getRecordings()` — the
    "readonly playback" view is a UI concern, not core state).
  - The behavior currently split across `useRecorder`/`useTranscription` moves
    in unchanged: active-time timer (250 ms ticks, paused time excluded),
    transcript/partial bookkeeping with the shared `appendTranscript` merge
    rule, pause stops the recognition session and inserts a paragraph break,
    resume continues appending, stop ends both together.
  - **Fail rule:** stopping with an empty transcript means nothing was
    recorded — the log is discarded (`discarded` event), nothing is saved.
  - `record()` failure handling: recorder start failure leaves the core idle;
    transcription start failure stops the recorder, returns to idle, emits
    `error`, and rethrows.
  - `MediaRecorderRecorder` — the recording logic of `useRecorder` (per-instance
    chunk capture, blob built on stop, tracks stopped after stop), minus the
    timer (the core owns the clock). Lives in
    `@personal-log/plugin-recorder-media`.
  - `IndexedDBStoragePlugin` — local persistence: one IndexedDB database, a
    `logs` object store keyed by log id; `list()` ordered oldest-first by
    `createdAt`. Lives in `@personal-log/plugin-storage-indexeddb`.
- **`apps/web`** — consumes the core: a thin `usePersonalLog` hook (app-local,
  not a package) constructs `PersonalLog` with the three plugins (media
  recorder, native transcriber, IndexedDB storage), binds state via
  `useSyncExternalStore`, and exposes the last recorded log as a playback
  object URL; `App.tsx` composes the existing components against it. The
deleted files: `hooks/useRecorder.ts`,
  `hooks/useTranscription.ts`, `hooks/useRecorder.test.ts`, `lib/plugins.ts`.
  All components, styling, and UX (PL-4 behavior, Gruvbox theme) are unchanged.
- **Repo layout conventions** hold: every named thing in its own file,
  `index.ts` files are barrels only.

Later work items add: the recordings list UI over `getRecordings()`, more
storage plugins (personal server, cloud), plugin configuration/selection.

## Rules that must survive the refactor

- The recording is the source of truth; the transcription is a derived
  artifact. Nothing may make one depend on the other.
- No data leaves the device; no network calls are introduced.
- `@personal-log/core` must not depend on React.

## References

- `features/braindump/arhitecture.md` — the four-concern architecture,
  Recorder/StoragePlugin sketches, the log data model
- `features/braindump/product.md` — core experience and design principles
- `features/PL-4-ui-improvements/spec.md` — the UI behavior the app must keep
  (Amendments 1–5; the transcript merge rules)
- `apps/web/src/hooks/useRecorder.ts`, `apps/web/src/hooks/useTranscription.ts`,
  `apps/web/src/App.tsx` — the logic that moves into core
- `packages/plugin-api`, `packages/plugins/transcription-native` — the existing
  plugin interfaces the core receives