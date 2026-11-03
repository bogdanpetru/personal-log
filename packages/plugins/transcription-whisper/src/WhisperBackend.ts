export interface WhisperBackend {
  transcribe(audio: Float32Array, language?: string): Promise<string>;
  reset(): void;
  terminate(): void;
}
