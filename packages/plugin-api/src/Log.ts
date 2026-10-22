import type { AudioArtifact } from "./AudioArtifact.js";
import type { TranscriptionArtifact } from "./TranscriptionArtifact.js";

export type LogId = string;

/**
 * A completed personal log. The audio artifact is authoritative; the
 * transcriptions are derived artifacts that can coexist side by side.
 */
export interface Log {
  id: LogId;
  createdAt: string;
  durationMs: number;
  audio: AudioArtifact;
  transcriptions: TranscriptionArtifact[];
}