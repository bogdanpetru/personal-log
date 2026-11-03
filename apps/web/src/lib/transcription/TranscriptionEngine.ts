export type TranscriptionEngine = "native" | "whisper";

export const TRANSCRIPTION_ENGINES: TranscriptionEngine[] = [
  "native",
  "whisper",
];

export function isTranscriptionEngine(value: unknown): value is TranscriptionEngine {
  return value === "native" || value === "whisper";
}
