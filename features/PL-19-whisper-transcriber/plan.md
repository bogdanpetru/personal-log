# PL-19 — Whisper transcriber plugin (lazy, user-selectable) — execution plan

## Goal

In Settings the user picks the transcription engine: Native (Web Speech API, today's behavior) or Whisper (transformers.js + ONNX whisper-base, q8, fully in-browser, runs in a web worker, off the recorder's shared `MediaStream`). Nothing is downloaded until Whisper is selected; the model download shows progress; download failure is surfaced and Native keeps working. Assets persist until offload; switching back to Native arms an offload that fires when the user leaves the Settings view, and re-selecting Whisper before leaving cancels it. All new UI strings are translated in all 21 locale files (en + 20 locales).

Commands that must pass at the end: `pnpm install && pnpm build && pnpm test`.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Spec resolutions

(The spec left these open; the plan pins them so no executor decision is needed.)

- **Stream sharing shape:** `Recorder` gains `getStream?(): MediaStream | null`; `TranscriptionOptions` gains `stream?: MediaStream`. Core reads it after `recorder.start()` and passes it into `startLive`. If a Whisper session gets no stream, that is an **error** (surfaced through core's error path, recording rolled back) — never a `getUserMedia` fallback. `recorder-media` needs no changes (implementation already exists).
- **Partials:** Whisper returns a chunk at a time, so there is no mid-chunk interim text. Every completed 5s chunk is a **final**: the plugin folds it with `appendTranscript` and fires `onFinalResult` with the full session text. `onPartialResult` stays wired (fires nothing for Whisper); core already clears partials on finals, so the UI degrades gracefully.
- **Capabilities:** `live: true, local: true, offline: true, languages: []`. `offline: true` holds once the model is cached (assets persist in Cache Storage); a re-download only happens after offload.
- **Engine switch timing:** takes effect for the next `startLive` call (i.e. the next recording) — done by a delegating selector plugin; core is never rebuilt.
- **Deferred offload arm:** armed only when the engine changes whisper → native **within the Settings view**; disarmed on any change to whisper; fired in the view's unmount cleanup. Offload = terminate the worker backend + `deleteWhisperAssets()` (Cache Storage); RAM is not the goal — a re-download after offload is expected.
- **Download trigger:** calling `ensureReady()` on the Whisper plugin when the user selects Whisper in Settings (plus whenever the plugin's worker is first used for a session). transformers.js serves from Cache Storage when present, so a repeat call is cheap/no-op.

Carried-over toolchain facts: transformers.js 3.8.1 already installed in `packages/plugins/transcription-whisper`; `pnpm-workspace.yaml` already has the `allowBuilds` workaround for its build steps; TS 6 repo-wide; Vitest 5 with `globals: true` in the whisper package's existing `vitest.config.ts`.

## Partial work already present — do not redo

`packages/plugins/transcription-whisper/` already exists with `package.json`, `tsconfig.json`, `vitest.config.ts`, and:

- `src/WhisperModel.ts` — model constants (`onnx-community/whisper-base`, `q8`, 16 kHz, `WHISPER_CHUNK_SECONDS = 5`) + `loadWhisperPipeline(onProgress?)` with webgpu→wasm fallback.
- `src/WhisperAssets.ts` + `src/WhisperAssets.test.ts` — `hasWhisperAssets` / `deleteWhisperAssets` over Cache Storage (seam accepts an injected `CacheStorage`).
- `src/WhisperBackend.ts` — `interface WhisperBackend { transcribe(audio: Float32Array, language?): Promise<string>; reset(): void; terminate(): void }`.

## Steps

### 1. [x] Widen plugin-api for stream sharing

**Files:** edit `packages/plugin-api/src/Recorder.ts`, `packages/plugin-api/src/types.ts`.

**What:** add the optional `getStream?(): MediaStream | null` member to `Recorder`; add `stream?: MediaStream` to `TranscriptionOptions`. Nothing else changes here — `recorder-media` already implements `getStream`.

**Conventions:** no comments in code; barrels untouched (both types flow through the existing `packages/plugin-api/src/index.ts` re-exports).

**Done when:** `pnpm -C packages/plugin-api typecheck && pnpm -C packages/plugins/recorder-media typecheck && pnpm -C packages/plugins/transcription-native typecheck` all pass (optional member breaks no implementer).

### 2. [x] Plum the stream through core into `startLive`

**Files:** edit `packages/core/src/PersonalLog.ts` (only `beginSession`), edit `packages/core/src/PersonalLog.test.ts`.

**What:** `beginSession()` builds `TranscriptionOptions` with `language` (as today) plus `stream` read from `this.recorder.getStream?.() ?? undefined`; the options object is passed whenever any field is set (empty object otherwise). Both the `record()` path (after `recorder.start()`, before `beginSession()`) and the `resume()` path get the stream through the same `beginSession()` — pause/resume never stops the recorder's tracks, so the stream stays alive. Core test: a fake recorder whose `getStream()` returns a sentinel stream, and a fake transcriber asserting `startLive` received `options.stream === sentinel` in both a `record()` and a `pause()` → `resume()` cycle.

**Conventions:** no comments; `stream: MediaStream | undefined` flows as part of the existing options construction, no new fields on `PersonalLog`.

**Done when:** `pnpm -C packages/core test` and `pnpm -C packages/core typecheck` pass.

### 3. [x] Whisper worker backend (web worker carries the pipeline)

**Files:** create `packages/plugins/transcription-whisper/src/WhisperWorker.ts` and `packages/plugins/transcription-whisper/src/WorkerWhisperBackend.ts` (optionally `src/WhisperWorkerProtocol.ts` for the shared message types — one file per named thing).

**What:** the worker entry is the process: on `load` it calls `loadWhisperPipeline(ratio → post progress)` and answers `ready`; on `transcribe` it runs the pipeline on the given 16 kHz `Float32Array` + language and answers `result`/`error`; on `reset` it clears any internal state; on `terminate` it `self.close()`s. `WorkerWhisperBackend` implements the existing `WhisperBackend` interface plus a `load(onProgress?)` method, and **lazily creates** the worker (first `load`/`transcribe`, not at construction) via `new Worker(new URL("./WhisperWorker.ts", import.meta.url), { type: "module" })` — Vite in `apps/web` bundles this pattern for source-only workspace packages. Message ids correlate responses with requests; sequential in the backend (one in-flight transcribe is enforced by the plugin in step 5, the worker just answers).

**Conventions:** transformers.js is already a dependency and must be imported only inside the worker file. No comments in code.

**Done when:** `pnpm -C packages/plugins/transcription-whisper typecheck` passes (the worker is exercised in the browser checklist, not unit-tested).

### 4. [x] AudioContext chunk source consuming the shared MediaStream

**Files:** create `packages/plugins/transcription-whisper/src/WhisperStreamSource.ts` and the worklet module `packages/plugins/transcription-whisper/src/WhisperStreamWorkletProcessor.js` (plain JS — worklet global scope cannot import TS); create a test `packages/plugins/transcription-whisper/src/WhisperStreamSource.test.ts`.

**What:** `WhisperStreamSource` takes the `MediaStream` + an `onChunk(Float32Array)` callback: builds `new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE })`, `MediaStreamAudioSourceNode` → `AudioWorkletNode` loading the processor via `new URL("./WhisperStreamWorkletProcessor.js", import.meta.url)`; the worklet posts mono PCM frames back (it runs at the context's 16 kHz, so no separate resampler), the main side accumulates frames and emits one `Float32Array` per `WHISPER_CHUNK_SECONDS` (80 000 samples). Expose `stop()` to close the AudioContext, and a way for the test to push frames manually (the frame→chunk accumulation is the tested seam; jsdom has no real `AudioContext`, so the test drives the accumulation handoff, not the real hardware path).

**Done when:** `pnpm -C packages/plugins/transcription-whisper test` passes (existing WhisperAssets test still green + the new accumulation test).

### 5. [x] WhisperTranscriberPlugin session logic + package barrel

**Files:** create `packages/plugins/transcription-whisper/src/WhisperTranscriberPlugin.ts`, `packages/plugins/transcription-whisper/src/WhisperStreamMissingError.ts`, and the barrel `packages/plugins/transcription-whisper/src/index.ts` (re-exports `WhisperTranscriberPlugin` only).

**What:** the plugin mirrors `NativeSpeechPlugin`'s shape (same lifecycles, `appendTranscript` folding from `@personal-log/plugin-api`):

- `id: "whisper"`, `name` "Whisper (in-browser)"; `capabilities()` per the spec resolution; `initialize()`/`dispose()` no-op/terminate.
- `ensureReady(onProgress?)`: lazily constructs the `WorkerWhisperBackend`, calls `load(onProgress)` — resolving means the model is usable; rejects on download failure.
- `startLive(options?)`: reads `options?.stream`; throws the `WhisperStreamMissingError` when absent. Starts a `WhisperStreamSource` on the stream; each emitted chunk enters a **sequential queue** (at most one `backend.transcribe` in flight, later chunks wait); each result folds via `appendTranscript` into committed session text and fires `onFinalResult(fullText)`; adds nothing to `onPartialResult`. Honors `options.language` when set (only optional language flows to the worker today; core's language lives in the same options — go with it).
- `stop()`: flushes any buffered-but-not-yet-transcribed audio through the backend (final chunk), then returns `{ text: committed }`.
- `offload()`: terminates the backend worker and calls `deleteWhisperAssets()`.

**Conventions:** no comments; import sibling files directly, not via the barrel; the barrel stays a pure re-export.

**Done when:** `pnpm -C packages/plugins/transcription-whisper typecheck` passes and `packages/plugins/transcription-whisper/src/index.ts` contains only re-exports.

### 6. [x] Plugin unit tests against a fake backend

**Files:** create `packages/plugins/transcription-whisper/src/WhisperTranscriberPlugin.test.ts`.

**What:** with an injected fake `WhisperBackend` (canned texts) and a manually drivable chunk source seam: assert (a) `startLive` without a stream throws the missing-stream error, (b) chunks transcribe strictly sequentially (fake backend rejects overlapping invocations), (c) each chunk result folds in order via `appendTranscript` and `onFinalResult` receives the full accumulated text, (d) `stop()` flushes buffered audio and returns the full text, (e) `offload` calls `deleteWhisperAssets` (inject the `CacheStorage` seam) - the existing `WhisperAssets.test.ts` pattern covers that seam.

**Done when:** `pnpm -C packages/plugins/transcription-whisper test` passes.

### 7. [x] Engine setting: values module + settings field

**Files:** create `apps/web/src/lib/transcription/TranscriptionEngine.ts`; edit `apps/web/src/lib/settings.ts`; edit `apps/web/src/lib/settings.test.ts`.

**What:** `TranscriptionEngine.ts` defines the union (`"native" | "whisper"`), the engine id list, and an `isTranscriptionEngine` guard. `settings.ts` gains `transcriptionEngine: TranscriptionEngine` on `Settings`, default `"native"`, validated on read like the other fields. Settings test covers the new default and that a corrupt persisted value falls back to `"native"`.

**Done when:** `pnpm -C apps/web test settings` passes.

### 8. [x] i18n: new settings keys in all 21 message files

**Files:** edit `apps/web/src/lib/i18n/messages/{en,zh,hi,es,fr,ar,bn,pt,ru,ur,id,de,ja,sw,mr,te,tr,ta,vi,ko,ro}.ts` — every file, one by one.

**What:** add these keys to `en.ts` first (they extend the `Messages` type every other locale must satisfy):

- `settings.engine`, `settings.engineHint` (pick how audio is transcribed; Whisper is downloaded on demand and runs entirely in the browser), `settings.engineNative`, `settings.engineWhisper`, `settings.engineReady` (model downloaded, running locally), `settings.engineDownloadFailed` (download failed, Web-engine still available).

Every locale gets a **real translation in its own language** (ar/ur are RTL — normal string entries, no dir handling needed in the file). No placeholder English in any non-en file.

**Done when:** `pnpm -C apps/web test i18n` passes — the parity test (`i18n.test.ts:46-49`) forces every key in every locale.

### 9. [x] Engine selector plugin + whisper singleton + app wiring

**Files:** create `apps/web/src/lib/transcription/whisperTranscriber.ts` (module-level `whisperTranscriber` singleton of `WhisperTranscriberPlugin`) and `apps/web/src/lib/transcription/TranscriptionEngineSelector.ts`; edit `apps/web/src/hooks/usePersonalLog.ts`.

**What:** `TranscriptionEngineSelector` implements `LiveTranscriptionPlugin` and delegates `capabilities`/`initialize`/`dispose`/`startLive` to the plugin chosen by `getSettings().transcriptionEngine` at call time (so a change takes effect for the next recording with zero core coupling). `usePersonalLog.ts` swaps its inline `new NativeSpeechPlugin()` for the selector (native and whisper singletons handed in); nothing else in the hook changes.

**Conventions:** no comments; these are named-thing files, not barrels — repo code inside `apps/web` imports them directly.

**Done when:** `pnpm -C apps/web typecheck` passes and `pnpm -C apps/web test` still passes.

### 10. [x] Settings UI: engine section with Select

**Files:** create `apps/web/src/views/SettingsView/components/TranscriptionEngineSelector.tsx`; edit `apps/web/src/views/SettingsView/SettingsView.tsx` (add the section between `transcriptionLanguage` and `downloadFormat`).

**What:** the component mirroring `ThemeSelector`'s button-group pattern (Native | Whisper from the engine list, labels via `t()` on the new keys). The view section uses `t("settings.engine")` + `t("settings.engineHint")` through `Text`. Selection writes `updateSettings({ transcriptionEngine })`.

**Conventions:** visible text only through `t()`/`Text`; pure-UI component (no core access — the offload/ready logic lives in the hooks/steps below).

**Done when:** `pnpm -C apps/web typecheck` and `pnpm -C apps/web test SettingsView` pass.

### 11. [x] Whisper download progress, ready and failure states in the UI

**Files:** edit `apps/web/src/views/SettingsView/components/TranscriptionEngineSelector.tsx`; edit `apps/web/src/views/SettingsView/SettingsView.test.tsx`.

**What:** when Whisper becomes the selected engine, the component effect calls `whisperTranscriber.ensureReady(ratio → setState)` exactly once per visit (unless a state is already known). States rendered: idle→downloading (`Progress` component from `@/components/Progress` fed the ratio), ready (`t("settings.engineReady")`), error (`t("settings.engineDownloadFailed")`); no state hides the Native option. Download failure results in an error surface only — the setting stays on Whisper so a retry is possible; nothing else regresses.

**Done when:** `pnpm -C apps/web test SettingsView` passes (tests drive the states with the mocked plugin).

### 12. [x] Deferred offload on leaving Settings

**Files:** create `apps/web/src/hooks/useDeferredWhisperOffload.ts`; edit `apps/web/src/views/SettingsView/SettingsView.tsx` to call it.

**What:** hook with the settings value + a flag ref: selecting Native *after* having been on Whisper **in this view's lifetime** arms the offload; selecting Whisper again disarms; if the offload is still armed when the view unmounts, the effect's cleanup fires `whisperTranscriber.offload()` (fire-and-forget `void ...`). Arming must not depend on whether the model has ever been downloaded (offloading nothing is a no-op). No blocking UI on unmount — the user leaves immediately, the deletion proceeds in the background.

**Done when:** `pnpm -C apps/web typecheck` passes and `pnpm -C apps/web test SettingsView` stays green.

### 13. [ ] Full verification

Run, in order, from the repo root — stop and report on the first failure:

```
pnpm install
pnpm build
pnpm test
```

After that, start the preview server in the background, e.g. `pnpm -C apps/web run dev -- --port 4173 >/tmp/opencode/preview.log 2>&1 &` (or the built `vite preview` — report which you used), wait for it to accept connections, and curl the pages: expect HTTP 200 for `/` and `/records`.

**Done when:** all three commands exit 0 and the two curls return 200.

### 14. [ ] Browser checklist (user performs; executor copies it into the report)

- Pick Whisper in Settings: download starts with visible progress; the record button prompts the mic once (no duplicate mic prompt, no duplicate mic indicator).
- Record with Whisper: transcript streams in ~5s-lag pieces; no un-transcribed partial text lingers on finals.
- Switch Whisper → Native but *stay* in Settings, then re-select Whisper before leaving: nothing is deleted — Cache Storage entries remain, and the ready/download state shows the cache hit (instant, near-zero progress).
- Switch Whisper → Native and leave Settings: DevTools → Application → Cache Storage shows the Whisper entries gone; selecting Whisper afterwards re-downloads.
- Turn the network off in browser devtools, with Whisper not downloaded: selecting Whisper shows the download-failed message, and Native still records normally once re-selected.
- Switch the app language to Arabic or Urdu: the engine section strings render translated and RTL layout intact.

**Done when:** the user confirms each line (executor: copy lines verbatim into the report; orchestrator hands them over).

### 15. [ ] HELD — commit (stop before running)

```
git add -A && git commit -m "PL-19: whisper transcriber plugin (lazy, user-selectable)"
```

The executor does **not** run this. Stop here and report the prepared commit; the orchestrator asks the user for approval and runs the exact command afterwards (repo rule, `AGENTS.md`).

### 16. [ ] Close out

Mark every `[ ]` in this file `[x]` and confirm the plan file shows all steps done.
