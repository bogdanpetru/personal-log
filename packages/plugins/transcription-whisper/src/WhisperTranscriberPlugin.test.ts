import { describe, expect, it } from "vitest";
import type { TranscriptionOptions } from "@personal-log/plugin-api";
import { WhisperStreamMissingError } from "./WhisperStreamMissingError.js";
import { WhisperTranscriberPlugin } from "./WhisperTranscriberPlugin.js";

const SENTINEL_STREAM = { tracks: [] } as unknown as MediaStream;

class FakeBackend {
  readonly texts: string[];
  loads = 0;
  terminated = false;
  resetCount = 0;
  readonly activations: number[] = [];
  readonly languages: Array<string | undefined> = [];
  private inFlight = false;
  private ready = false;

  constructor(texts: string[]) {
    this.texts = texts;
  }

  load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    this.loads += 1;
    onProgress?.(0.5);
    this.ready = true;
    return Promise.resolve();
  }

  async transcribe(audio: Float32Array, language?: string): Promise<string> {
    if (this.inFlight) {
      throw new Error("overlapping transcribe");
    }
    this.inFlight = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      this.activations.push(audio[0]);
      this.languages.push(language);
      return this.texts[this.activations.length - 1] ?? "";
    } finally {
      this.inFlight = false;
    }
  }

  reset(): void {
    this.resetCount += 1;
  }

  terminate(): void {
    this.terminated = true;
  }
}

class FakeSource {
  readonly stream: MediaStream;
  readonly onChunk: (chunk: Float32Array) => void;
  started = false;
  stopped = false;
  readonly drivenFrames: number[] = [];

  constructor(stream: MediaStream, onChunk: (chunk: Float32Array) => void) {
    this.stream = stream;
    this.onChunk = onChunk;
  }

  start(): Promise<void> {
    this.started = true;
    return Promise.resolve();
  }

  stop(): void {
    this.stopped = true;
  }

  pushFrame(frame: Float32Array): void {
    this.drivenFrames.push(frame[0]);
    this.onChunk(frame);
  }
}

function setup(texts: string[], storage?: CacheStorage) {
  const backend = new FakeBackend(texts);
  const sources: FakeSource[] = [];
  const createdStreams: MediaStream[] = [];
  const plugin = new WhisperTranscriberPlugin({
    backend: backend as never,
    createSource: (stream, onChunk) => {
      createdStreams.push(stream);
      const source = new FakeSource(stream, onChunk);
      sources.push(source);
      return source;
    },
    storage,
  });
  return { plugin, backend, sources, createdStreams };
}

describe("WhisperTranscriberPlugin", () => {
  it("rejects startLive without a stream", async () => {
    const { plugin } = setup(["hello"]);
    await expect(plugin.startLive()).rejects.toBeInstanceOf(
      WhisperStreamMissingError,
    );
    await expect(plugin.startLive({} as TranscriptionOptions)).rejects.toThrow(
      "shared MediaStream",
    );
  });

  it("transcribes chunks strictly sequentially and in arrival order", async () => {
    const { plugin, backend, sources } = setup(["alpha", "bravo", "charlie"]);
    const session = await plugin.startLive({
      stream: SENTINEL_STREAM,
      language: "en-US",
    });
    for (const first of [100, 200, 300]) {
      sources[0].pushFrame(new Float32Array([first]));
    }
    const result = await session.stop();
    expect(sources[0].stream).toBe(SENTINEL_STREAM);
    expect(sources[0].started).toBe(true);
    expect(sources[0].stopped).toBe(true);
    expect(backend.activations).toEqual([100, 200, 300]);
    expect(backend.languages).toEqual(["en", "en", "en"]);
    expect(result.text).toBe("alpha bravo charlie");
  });

  it("fires onFinalResult with the full accumulated text per chunk and never partial results", async () => {
    const { plugin, sources } = setup(["alpha", "bravo", "charlie"]);
    const session = await plugin.startLive({ stream: SENTINEL_STREAM });
    const finals: string[] = [];
    session.onFinalResult((text) => finals.push(text));
    session.onPartialResult(() => {
      throw new Error("whisper must not fire partial results");
    });
    sources[0].pushFrame(new Float32Array([1]));
    sources[0].pushFrame(new Float32Array([2]));
    sources[0].pushFrame(new Float32Array([3]));
    await session.stop();
    expect(finals).toEqual(["alpha", "alpha bravo", "alpha bravo charlie"]);
  });

  it("stop() flushes buffered chunks through the backend", async () => {
    const { plugin, backend, sources } = setup(["alpha", "bravo"]);
    const session = await plugin.startLive({ stream: SENTINEL_STREAM });
    const finals: string[] = [];
    session.onFinalResult((text) => finals.push(text));
    sources[0].pushFrame(new Float32Array([10]));
    sources[0].pushFrame(new Float32Array([20]));
    const result = await session.stop();
    expect(backend.activations).toEqual([10, 20]);
    expect(result.text).toBe("alpha bravo");
    expect(finals).toEqual(["alpha", "alpha bravo"]);
  });

  it("loads the backend at startLive even when ensureReady was not awaited", async () => {
    const { plugin, backend } = setup(["alpha"]);
    expect(backend.loads).toBe(0);
    const session = await plugin.startLive({ stream: SENTINEL_STREAM });
    expect(backend.loads).toBe(1);
    await session.stop();
  });

  it("ensureReady resolves through the backend load", async () => {
    const { plugin, backend } = setup(["alpha"]);
    const ratios: number[] = [];
    await plugin.ensureReady((ratio) => ratios.push(ratio));
    expect(backend.loads).toBe(1);
    expect(ratios).toEqual([0.5]);
    await plugin.ensureReady();
    expect(backend.loads).toBe(1);
  });

  it("offload terminates the backend and deletes whisper assets", async () => {
    const urls = [
      "https://huggingface.co/onnx-community/whisper-base/resolve/main/config.json",
      "https://example.com/unrelated.bin",
    ];
    const cache = {
      keys: async () => urls.map((url) => ({ url }) as unknown as Request),
      delete: async (request: Request) => {
        const index = urls.findIndex((url) => url === request.url);
        if (index === -1) return false;
        const removed = urls.splice(index, 1);
        return removed.length > 0;
      },
    };
    const storage = {
      keys: async () => ["transformers-cache"],
      open: async () => cache as unknown as Cache,
    } as unknown as CacheStorage;
    const { plugin, backend } = setup([], storage);
    await plugin.offload();
    expect(backend.terminated).toBe(true);
    expect(urls).toEqual(["https://example.com/unrelated.bin"]);
  });

  it("dispose terminates the backend", async () => {
    const { plugin, backend } = setup([]);
    await plugin.dispose();
    expect(backend.terminated).toBe(true);
  });

  it("capabilities advertise live local offline transcription", () => {
    const { plugin } = setup([]);
    expect(plugin.id).toBe("whisper");
    expect(plugin.name).toBe("Whisper (in-browser)");
    expect(plugin.capabilities()).toEqual({
      live: true,
      local: true,
      offline: true,
      languages: [],
    });
  });
});
