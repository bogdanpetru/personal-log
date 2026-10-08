import type {
  AudioInput,
  TranscriptionCapabilities,
  TranscriptionOptions,
  TranscriptionResult,
} from "./types.js";

export interface TranscriptionPlugin {
  id: string;
  name: string;
  capabilities(): TranscriptionCapabilities;
  initialize(config: unknown): Promise<void>;
  transcribe?(
    input: AudioInput,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult>;
  dispose(): Promise<void>;
}
