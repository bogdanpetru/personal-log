import { appendTranscript } from "@personal-log/plugin-api";
import type {
  LiveTranscriptionPlugin,
  TranscriptionOptions,
} from "@personal-log/plugin-api";
import type { WhisperBackend } from "./WhisperBackend.js";
import { deleteWhisperAssets } from "./WhisperAssets.js";
import { WhisperStreamMissingError } from "./WhisperStreamMissingError.js";
import { WhisperStreamSource } from "./WhisperStreamSource.js";
import { toWhisperLanguage } from "./toWhisperLanguage.js";
import { WorkerWhisperBackend } from "./WorkerWhisperBackend.js";

type LiveSession = Awaited<ReturnType<LiveTranscriptionPlugin["startLive"]>>;

type BackendWithLoad = WhisperBackend & {
  load(onProgress?: (ratio: number) => void): Promise<void>;
};

type WhisperSource = {
  start(): Promise<void>;
  stop(): void;
  pushFrame(audio: Float32Array): void;
};

type CreateSource = (
  stream: MediaStream,
  onChunk: (chunk: Float32Array) => void,
) => WhisperSource;

export type WhisperTranscriberPluginOptions = {
  backend?: BackendWithLoad;
  createSource?: CreateSource;
  storage?: CacheStorage;
};

export class WhisperTranscriberPlugin implements LiveTranscriptionPlugin {
  readonly id = "whisper";
  readonly name = "Whisper (in-browser)";

  private readonly backend: BackendWithLoad;
  private readonly createSource: CreateSource;
  private readonly storage: CacheStorage | undefined;

  constructor(options: WhisperTranscriberPluginOptions = {}) {
    this.backend = options.backend ?? new WorkerWhisperBackend();
    this.createSource = options.createSource ?? defaultCreateSource;
    this.storage = options.storage;
  }

  capabilities() {
    return { live: true, local: true, offline: true, languages: [] };
  }

  async initialize(): Promise<void> {}

  async dispose(): Promise<void> {
    this.backend.terminate();
  }

  async ensureReady(onProgress?: (ratio: number) => void): Promise<void> {
    await this.backend.load(onProgress);
  }

  async offload(): Promise<void> {
    this.backend.terminate();
    await deleteWhisperAssets(this.storage);
  }

  async startLive(options?: TranscriptionOptions): Promise<LiveSession> {
    const stream = options?.stream;
    if (stream === undefined) {
      throw new WhisperStreamMissingError();
    }
    await this.ensureReady();
    const language =
      options?.language === undefined
        ? undefined
        : toWhisperLanguage(options.language);
    let source: WhisperSource | undefined;
    let committed = "";
    let tail: Promise<void> = Promise.resolve();
    let failure: Error | undefined;
    let onFinal: ((text: string) => void) | undefined;
    const partialListeners = new Set<(text: string) => void>();

    const transcribe = (audio: Float32Array) => {
      tail = tail.then(async () => {
        try {
          const text = await this.backend.transcribe(audio, language);
          if (text !== "") {
            committed = appendTranscript(committed, text);
            onFinal?.(committed);
          }
        } catch (error) {
          failure ??= toError(error);
        }
      });
    };

    source = this.createSource(stream, (chunk) => {
      transcribe(chunk);
    });
    await source.start();

    return {
      onPartialResult(callback: (text: string) => void) {
        partialListeners.add(callback);
      },
      onFinalResult(callback: (text: string) => void) {
        onFinal = callback;
      },
      stop: async () => {
        source?.stop();
        source = undefined;
        partialListeners.clear();
        await tail;
        if (failure !== undefined) {
          throw failure;
        }
        return { text: committed };
      },
    };
  }
}

function defaultCreateSource(
  stream: MediaStream,
  onChunk: (chunk: Float32Array) => void,
): WhisperSource {
  return new WhisperStreamSource(stream, onChunk);
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
