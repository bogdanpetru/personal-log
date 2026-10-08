# PL-3 — Transcribe plugin

## Goal

The first transcription plugin. The live transcription logic currently hardcoded in
the app (`apps/web/src/hooks/useRecorder.ts`) is extracted into a plugin that wraps the
browser's Web Speech API, and a transcription plugin interface is defined so that future
plugins (e.g. Whisper-based) can be added to provide transcription via different
technologies without changing the app. The app behaves exactly as before: press Start,
the button becomes "Listening", live transcription (final text + muted interim text)
renders under the button, press again to stop.

## Tech stack

- **Layout:** monorepo packages per the architecture doc — `packages/plugin-api`
  (shared TypeScript interfaces) and `packages/plugins/transcription-native`
  (the Web Speech API plugin). `pnpm-workspace.yaml` already lists `packages/*`.
- **Shared tsconfig:** a repo-root `tsconfig.base.json` holds the common compiler
  options; each plugin package's tsconfig extends it and overrides only its
  specifics (e.g. vitest types). `apps/web` keeps its existing Vite-template
  tsconfigs.
- **App wiring:** `apps/web` consumes the plugin through the interface only; it no
  longer touches `SpeechRecognition` directly.

## Scope

- **Plugin interface** in `packages/plugin-api` — two exported interfaces:
  `TranscriptionPlugin` (`id`, `name`, `capabilities()`, `initialize(config)`,
  optional batch `transcribe(input, options?)`, `dispose()`) and
  `LiveTranscriptionPlugin extends TranscriptionPlugin` with required
  `startLive(options?)` returning a session (`onPartialResult`,
  `onFinalResult`, `stop()`). Supporting types (capabilities, input, options,
  result, session) are internal to the package; consumers derive sub-types via
  indexed access when needed. Live is required so call sites never need guards
  or non-null assertions; batch stays optional until something calls it.
  `capabilities()` (`live`, `local`, `languages`, `offline`) tells the app what
  a plugin supports.
- **First plugin** `packages/plugins/transcription-native`: a `NativeSpeechPlugin`
  class implementing `LiveTranscriptionPlugin` — plugins are classes with
  semantics, not factory functions returning plain objects — wrapping the Web
  Speech API with the behavior extracted from `useRecorder` — continuous,
  interim results, auto-restart on `onend` while a session is active. Implements
  live only; batch `transcribe()` is not implemented by this plugin.
- **Capabilities reporting:** the native plugin reports capabilities honestly
  (e.g. `live: true`, `local` per what the browser exposes). No local-only enforcement
  and no server-fallback prevention in this ticket — that behavior decision is
  deferred to a later work item.
- **Registration:** the app keeps an explicit registry with the native plugin as the
  single, default transcription plugin. No selection, no switching, no persistence
  of choice — plugin selection arrives in a later work item.
- **App refactor:** `useRecorder` keeps only recording concerns (microphone,
  `MediaRecorder`); live transcription results come from the plugin through the
  interface.
- Existing app behavior is unchanged (PL-1 behavior: Start/Listening button,
  recording indicator, final + interim transcription, stop keeps the transcript).

Later work items create the rest: more transcription plugins (e.g. Whisper), plugin
selection and its persistence, batch transcription usage, local-only enforcement.

## References

- `features/braindump/arhitecture.md` — §5 (plugin interface), §6 (native plugin),
  §11 (registration), §15 (repo structure)
- `apps/web/src/hooks/useRecorder.ts` — the code being extracted
- `features/PL-1-basic-app/spec.md` — the app behavior that must stay unchanged
