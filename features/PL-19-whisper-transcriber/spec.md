# PL-19 — Whisper transcriber plugin (lazy, user-selectable)

## Goal

In Settings the user picks the transcription engine: Native (Web Speech API, today's behavior) or Whisper (runs fully in the browser). Picking Whisper downloads the model on demand — nothing is fetched until then. Switching back to Native deletes the downloaded Whisper assets, but only after the user leaves the settings page, so a change of mind cancels the offload.

## Decisions

- **Engine:** transformers.js (`@huggingface/transformers`, v3+) with ONNX quantized Whisper; WebGPU first, WASM fallback. Inference runs in a web worker, not the main thread.
- **Model:** whisper-base, quantized ONNX build (multilingual, ~80MB download).
- **Streaming:** Whisper has no native streaming, so the plugin transcribes buffered audio chunks (~every 5s) while recording — interim transcript with a few seconds of lag, close to the native experience.
- **Mic sharing:** Whisper consumes the recorder's live `MediaStream` — no duplicate `getUserMedia`. The `Recorder` interface gains an optional `getStream()` (already implemented in `MediaRecorderRecorder` at `MediaRecorderRecorder.ts:61-63`), `TranscriptionOptions` gains the stream, and core passes it into `startLive` after starting the recorder.
- **i18n:** all new user-facing strings are translated into **all 20 locales** — the locale parity test (`i18n.test.ts`) makes English-only keys a failure; the `en` fallback is for graceful degradation, never for shipping untranslated strings.
- **Offload semantics:** "offload" = delete the downloaded model files from persistent storage. Freeing RAM is not enough — a re-download is expected after offload.

## Scope

- New package `@personal-log/plugin-transcription-whisper` (under `packages/plugins/`) implementing the (widened) transcriber plugin interface (`packages/plugin-api`), injectable in place of the native plugin, mirroring its structure (`packages/plugins/transcription-native/src/NativeSpeechPlugin.ts` as the reference shape). The scaffold (`package.json`, `tsconfig.json`, `vitest.config.ts`) plus `src/WhisperModel.ts`, `src/WhisperAssets.ts`, `src/WhisperAssets.test.ts` and `src/WhisperBackend.ts` already exist from a partial first execution — reuse them.
- Plugin-api/core widening for stream sharing: interface `getStream()`, option carries the `MediaStream`, core plumbs it into the transcriber session; `recorder-media` requires no changes (implementation already present).
- Transcriber-engine setting on the existing settings view (`apps/web/src/views/SettingsView`): Native | Whisper, Native is default, persisted with the existing settings mechanism, strings translated into all 20 locales.
- On-demand lifecycle: choosing Whisper the first time starts the model download with visible progress; download failure (e.g. offline) is surfaced and the native engine remains usable. Downloaded assets persist across sessions until offloaded.
- Chunked live transcription while recording on the shared mic stream, with interim text surfaced the same way the native plugin streams partials.
- Deferred offload: leaving the Settings view after switching back to Native triggers deletion of the Whisper assets; if Whisper is re-selected before leaving, the pending offload is cancelled and nothing is deleted.

## References

- Transcriber plugin contract + native implementation: `packages/plugin-api`, `packages/plugins/transcription-native/src/NativeSpeechPlugin.ts`
- Settings view: `apps/web/src/views/SettingsView`
- Recording: `packages/plugins/recorder-media/src/MediaRecorderRecorder.ts`