import type { AudioArtifact } from "./AudioArtifact.js";
import type { TranscriptionArtifact } from "./TranscriptionArtifact.js";

export type LogId = string;

/**
 * A completed personal log: cheap metadata, safe to list and page. The
 * audio itself lives in the storage backend and is fetched on demand via
 * `StoragePlugin.getLogData` (as `LogData`); the transcriptions are derived
 * artifacts that can coexist side by side.
 */
export interface Log {
  id: LogId;
  title?: string;
  createdAt: string;
  durationMs: number;
  audio: AudioArtifact;
  transcriptions: TranscriptionArtifact[];
}