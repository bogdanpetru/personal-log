export class NativeSpeechUnsupportedError extends Error {
  constructor() {
    super("SpeechRecognition is not supported in this browser");
    this.name = "NativeSpeechUnsupportedError";
  }
}
