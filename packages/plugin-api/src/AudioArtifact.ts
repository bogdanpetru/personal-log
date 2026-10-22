/**
 * The stored form of a recording's audio. The blob is the source of truth —
 * everything else on a log is derived and can be regenerated from it.
 */
export interface AudioArtifact {
  id: string;
  mimeType: string;
  size: number;
  createdAt: string;
  blob: Blob;
}