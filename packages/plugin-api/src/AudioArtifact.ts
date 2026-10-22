/**
 * Metadata about a recording's audio. The bytes themselves live in the
 * storage backend (e.g. an OPFS file) and are fetched on demand via
 * `StoragePlugin.getLogData` — the metadata is what listing and paging over
 * logs returns.
 */
export interface AudioArtifact {
  id: string;
  mimeType: string;
  size: number;
  createdAt: string;
}