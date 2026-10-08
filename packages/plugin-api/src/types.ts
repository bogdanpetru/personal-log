export interface TranscriptionCapabilities {
  live: boolean;
  local: boolean;
  languages: string[];
  offline: boolean;
}

export interface AudioInput {
  blob: Blob;
}

export interface TranscriptionOptions {
  language?: string;
}

export interface TranscriptionResult {
  text: string;
}

export interface LiveTranscriptionSession {
  onPartialResult(callback: (text: string) => void): void;
  onFinalResult(callback: (text: string) => void): void;
  stop(): Promise<TranscriptionResult>;
}
