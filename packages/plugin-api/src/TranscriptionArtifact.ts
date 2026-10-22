import type { LogId } from "./Log.js";

/**
 * A transcription of a log, produced by a transcription plugin. Derived data:
 * it references the recording rather than replacing it, so it can be deleted
 * or regenerated without touching the source of truth.
 */
export interface TranscriptionArtifact {
  id: string;
  logId: LogId;
  /** Plugin id of the provider that produced this transcription. */
  providerId: string;
  language?: string;
  createdAt: string;
  text: string;
}