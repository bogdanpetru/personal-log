/**
 * Minimal and extensible: every field is optional, and more can be added
 * later. A backend that cannot support a part may ignore it.
 */
export interface LogFilter {
  /** Substring match on transcription text. */
  search?: string;
  /** Inclusive lower bound on `createdAt` (ISO string). */
  from?: string;
  /** Exclusive upper bound on `createdAt` (ISO string). */
  to?: string;
}