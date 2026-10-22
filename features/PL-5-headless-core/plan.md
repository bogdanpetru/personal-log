# PL-5 — Headless `PersonalLog` core

## Goal

The application's heart — recording, live transcription, session state, plugin
orchestration — lives in a new headless package `@personal-log/core`. It is a
plain TypeScript library with no React: constructed with injected plugins, used
through commands, events, and queries. `apps/web` keeps its current UI and
consumes the core. There is no UI package.

Definition of done: the core package exists and typechecks, the web app behaves
exactly as it does today (PL-4 spec Amendments 1–5), and `pnpm install`,
`pnpm build`, `pnpm test`, and `pnpm -r typecheck` all pass.

## Architecture

- **`@personal-log/plugin-api`** gains the injectable interfaces and data
  model: `Recorder`/`Recording`, `StoragePlugin`, and `Log`/`LogId`/
  `AudioArtifact`/`TranscriptionArtifact` (shape per the braindump; the audio
  artifact carries the `Blob`).
- **`@personal-log/core`** (`packages/core`) — depends only on plugin-api:
  - `PersonalLog` — the orchestrator: session state machine, timer, transcript
    bookkeeping, event emitter, storage pipeline.
  - `MediaRecorderRecorder` — default `Recorder`; the recording logic moved
    out of `apps/web/src/hooks/useRecorder.ts` (timer excluded — `PersonalLog`
    owns the clock).
  - `InMemoryStoragePlugin` — default storage, so `getRecordings()` works.
- **The public API is fixed by the spec** — implement exactly the contract in
  `features/PL-5-headless-core/spec.md` ("The API contract" section):
  constructor injection of `recorder`/`transcriber`/`storage` (all optional,
  with those defaults), `record/pause/resume/stop`, `setLanguage`, `getState`,
  `on("state" | "recorded" | "discarded" | "error")` returning unsubscribe
  functions, `getRecordings`, `deleteRecording`, `isTranscriptionSupported`,
  `dispose`.
- **`apps/web`** — app-local `usePersonalLog` hook binds the core with
  `useSyncExternalStore` and exposes the last recorded log as a playback
  object URL; `App.tsx` composes the existing components (all unchanged).

Behavior that must be preserved verbatim (sources: the current hooks and the
PL-4 spec): active-time timer with paused time excluded; pause stops the
recognition session and appends a paragraph break; resume resumes transcription
first (on failure stays paused) and keeps appending; stop ends recorder and
transcription together; stopping with an empty transcript discards the log;
recording failure handling per the spec; transcript merging via the shared
`appendTranscript` from plugin-api.

Conventions: one named thing per file, `index.ts` files are barrels only;
intra-package imports are relative, cross-package through barrels.

## Ground rules

- Work from the repo root. Do steps in order. Each step has a **Done when**
  check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this
  file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix
  options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and
  report the prepared commit (exact command + message); the orchestrator asks
  the user for approval.

## Steps

### 1. [x] `@personal-log/plugin-api`: injectable interfaces and log data model

Add `Recorder`/`Recording`, `StoragePlugin`, and the log data model
(`Log`, `LogId`, `AudioArtifact`, `TranscriptionArtifact`) per the spec, each in
its own file, exported through the package barrel. Do not touch the existing
transcription interfaces.

**Done when:** `pnpm -C packages/plugin-api typecheck` passes.

### 2. [x] Scaffold `packages/core` (`@personal-log/core`)

Package files mirroring the sibling plugin packages (`packages/plugins/transcription-native`):
`package.json` (dependency on `@personal-log/plugin-api`, test/typecheck scripts,
same devDependencies/versions), `tsconfig.json`, `vitest.config.ts`. Empty
`src/index.ts` barrel. Run `pnpm install` so the workspace links the package.

**Done when:** `pnpm install` succeeds and `pnpm -C packages/core typecheck` passes.

### 3. [x] `MediaRecorderRecorder`

The default `Recorder`, ported from `apps/web/src/hooks/useRecorder.ts`: getUserMedia,
per-instance chunk capture, blob built on stop, mic tracks stopped after stop,
pause/resume delegation. No timer. Write tests for it (the old
`useRecorder.test.ts` is a good source for what to cover): start/stop
lifecycle, blob built from the captured chunks, stop without chunks, and
pause/resume delegating to MediaRecorder.

**Done when:** `pnpm -C packages/core test` and `typecheck` pass.

### 4. [x] `InMemoryStoragePlugin` (superseded → steps 8–9)

> Executed as written, then superseded by the mid-flight decision that every
> plugin is its own package and storage persists via IndexedDB. Step 9 removes
> this class from core; step 8 replaces it.

Default `StoragePlugin` per the spec: in-memory map, save/get/list/delete,
`list()` ordered oldest-first by `createdAt`. Write tests covering the basic
crud roundtrip and the list ordering.

**Done when:** `pnpm -C packages/core test` and `typecheck` pass.

### 5. [x] `PersonalLog`

The orchestrator per the spec's API contract and behavior rules: state machine
(`idle | recording | paused`; `stop()` returns to idle and delivers the log via
`recorded`/storage), 250 ms timer with paused time excluded, live-transcription
session management with the shared `appendTranscript` merge rule, the pause
paragraph break, the empty-transcript discard rule, and the failure handling from
the spec. One file per named thing (`PersonalLogState`, `PersonalLogOptions`,
`PersonalLogEvents`, `PersonalLog`); barrel exports everything public. Write
tests with fake recorder/transcriber/storage covering, at a high level: state
transitions for each command and the no-op guards; transcript merging and
partials (including across a pause/resume boundary and the paragraph break);
the timer freezing while paused; `stop()` saving a log and emitting `recorded`;
the empty-transcript discard; record-only mode without a transcriber; recorder
and transcription start failures; and the events firing plus unsubscribing.

**Done when:** `pnpm -C packages/core test` and `typecheck` pass.

### 6. [x] Rework `apps/web` on top of the core

Add `@personal-log/core` as a workspace dependency. New app-local hook
`hooks/usePersonalLog.ts`: constructs one `PersonalLog` with the native speech
plugin, binds state via `useSyncExternalStore`, turns `recorded` logs into
playback object URLs (revoked on discard/new recording). Rewrite `App.tsx` to
compose the hook with the existing components; components, styling, and UX stay
unchanged. Delete `hooks/useRecorder.ts`, `hooks/useTranscription.ts`,
`hooks/useRecorder.test.ts`, `lib/plugins.ts`. The existing app-level tests keep passing (adjust only where
they referenced deleted modules).

**Done when:** `pnpm -C apps/web typecheck`, `test`, and `lint` pass.

### 7. [x] `@personal-log/plugin-recorder-media`

Move `MediaRecorderRecorder` (and its tests) out of `packages/core` into a new
plugin package `packages/plugins/recorder-media`, mirroring the layout of
`packages/plugins/transcription-native` (package.json, tsconfig, vitest config,
src barrel).

**Done when:** `pnpm -C packages/plugins/recorder-media test` and `typecheck`
pass.

### 8. [x] `@personal-log/plugin-storage-indexeddb`

New plugin package `packages/plugins/storage-indexeddb` with
`IndexedDBStoragePlugin`: one database, a `logs` object store keyed by log id,
lazy connection open, promise-wrapped IDB requests, `list()` ordered
oldest-first, `dispose()` closing the connection. Write tests against
`fake-indexeddb` covering: save/get roundtrip (including a Blob), list
ordering, delete, and initialize/dispose. `fake-indexeddb` is a devDependency
of the package (project-local test dep).

**Done when:** `pnpm -C packages/plugins/storage-indexeddb test` and
`typecheck` pass.

### 9. [x] Core loses its defaults; `apps/web` wires the plugin packages

Remove `MediaRecorderRecorder` and `InMemoryStoragePlugin` from `packages/core`.
`PersonalLogOptions`: `recorder` required, `storage` optional (no storage →
logs are not persisted, `getRecordings()` is `[]`, `stop()` still emits
`recorded`), `transcriber` unchanged. Update the core tests (fake storage).
`apps/web` adds both plugin packages and constructs
`PersonalLog({ recorder, transcriber, storage })` in `usePersonalLog`.

**Done when:** `pnpm -C packages/core test` and `typecheck` pass, and
`pnpm -C apps/web typecheck` and `test` pass.

### 10. [x] Full verification

From the repo root: `pnpm install && pnpm build && pnpm test && pnpm -r --if-present typecheck && pnpm -r --if-present lint`. Then start the preview server in the
background and confirm it serves (curl the root for HTTP 200).

**Done when:** all commands pass and the preview responds 200.

### 11. [x] Browser checklist (report back — the user verifies)

Put this checklist in the report; do not attempt it headless:

- Initial state: centered red record button; language selector defaults to the
  browser language.
- Record: transcript streams live, timer ticks; pause freezes both and inserts
  a paragraph break; resume appends on the fresh line.
- Stop: playback row with progress bar appears, transcript stays; record button
  absent; reload resets to the initial state.
- Starting a new recording after a reload discards the old playback; a
  recognized-empty recording keeps nothing (back to initial state).

- Stopping with a recognized-empty recording keeps nothing (back to the initial
  state).
- Logs persist: after recording, IndexedDB (devtools → Application) shows the
  `personal-log` database with a `logs` entry; a reload resets the app state
  as before.

### 12. [ ] Commit (held)

`git add -A && git commit -m "PL-5: extract headless PersonalLog core with injected plugins"`

Stop before running it. Report the prepared commit; the orchestrator asks the
user for approval and runs it.