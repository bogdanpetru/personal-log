import type {
  LiveTranscriptionPlugin,
  Recorder,
  StoragePlugin,
} from "@personal-log/plugin-api";

/** Injected collaborators. Plugins are separate packages — none are defaulted. */
export interface PersonalLogOptions {
  /** The audio source, e.g. the browser MediaRecorder plugin. Required. */
  recorder: Recorder;
  /** Live transcription; absent → record-only mode. */
  transcriber?: LiveTranscriptionPlugin;
  /** Where completed logs go; absent → logs are not persisted. */
  storage?: StoragePlugin;
}