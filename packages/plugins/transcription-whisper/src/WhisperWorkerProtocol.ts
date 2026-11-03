export type WhisperWorkerInboundMessage =
  | { type: "load" }
  | { type: "transcribe"; id: number; audio: Float32Array; language?: string }
  | { type: "reset" }
  | { type: "terminate" };

export type WhisperWorkerOutboundMessage =
  | { type: "progress"; ratio: number }
  | { type: "ready" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id?: number; message: string };
