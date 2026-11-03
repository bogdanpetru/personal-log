export class WhisperStreamMissingError extends Error {
  constructor() {
    super("Whisper transcription requires the recorder's shared MediaStream");
    this.name = "WhisperStreamMissingError";
  }
}
