import {
  WHISPER_CHUNK_SECONDS,
  WHISPER_SAMPLE_RATE,
} from "./WhisperModel.js";

const CHUNK_SAMPLE_COUNT = WHISPER_SAMPLE_RATE * WHISPER_CHUNK_SECONDS;
const WORKLET_PROCESSOR_NAME = "whisper-stream-worklet-processor";

export class WhisperStreamSource {
  private readonly stream: MediaStream;
  private readonly onChunk: (chunk: Float32Array) => void;
  private context: AudioContext | undefined;
  private source: MediaStreamAudioSourceNode | undefined;
  private pending = new Float32Array(CHUNK_SAMPLE_COUNT);
  private offset = 0;

  constructor(stream: MediaStream, onChunk: (chunk: Float32Array) => void) {
    this.stream = stream;
    this.onChunk = onChunk;
  }

  async start(): Promise<void> {
    const context = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
    await context.audioWorklet.addModule(
      new URL("./WhisperStreamWorkletProcessor.js", import.meta.url),
    );
    const node = new AudioWorkletNode(context, WORKLET_PROCESSOR_NAME, {
      numberOfOutputs: 0,
    });
    node.port.onmessage = (event: MessageEvent<Float32Array>) => {
      this.pushFrame(event.data);
    };
    const source = context.createMediaStreamSource(this.stream);
    source.connect(node);
    this.context = context;
    this.source = source;
  }

  stop(): void {
    if (this.source !== undefined) {
      this.source.disconnect();
      this.source = undefined;
    }
    this.context?.close().catch(() => undefined);
    this.context = undefined;
  }

  pushFrame(frame: Float32Array): void {
    let cursor = 0;
    while (cursor < frame.length) {
      const take = Math.min(CHUNK_SAMPLE_COUNT - this.offset, frame.length - cursor);
      this.pending.set(frame.subarray(cursor, cursor + take), this.offset);
      this.offset += take;
      cursor += take;
      if (this.offset === CHUNK_SAMPLE_COUNT) {
        const chunk = this.pending;
        this.pending = new Float32Array(CHUNK_SAMPLE_COUNT);
        this.offset = 0;
        this.onChunk(chunk);
      }
    }
  }
}
