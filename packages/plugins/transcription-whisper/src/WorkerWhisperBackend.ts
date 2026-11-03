import type { WhisperBackend } from "./WhisperBackend.js";
import type { WhisperWorkerOutboundMessage } from "./WhisperWorkerProtocol.js";

type PendingLoad = {
  resolve: () => void;
  reject: (error: Error) => void;
};

type PendingTranscribe = {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
};

export class WorkerWhisperBackend implements WhisperBackend {
  private worker: Worker | undefined;
  private ready = false;
  private pendingLoad: PendingLoad | undefined;
  private pendingTranscribes = new Map<number, PendingTranscribe>();
  private nextTranscribeId = 0;
  private onProgress: ((ratio: number) => void) | undefined;

  load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.ready) {
      return Promise.resolve();
    }
    this.onProgress = onProgress;
    this.ensureWorker();
    const worker = this.worker!;
    if (this.pendingLoad === undefined) {
      return new Promise<void>((resolve, reject) => {
        this.pendingLoad = { resolve, reject };
        worker.postMessage({ type: "load" });
      });
    }
    return new Promise<void>((resolve, reject) => {
      this.pendingLoad!.resolve = resolve;
      this.pendingLoad!.reject = reject;
    });
  }

  transcribe(audio: Float32Array, language?: string): Promise<string> {
    if (this.worker === undefined || !this.ready) {
      return this.load().then(() => this.transcribe(audio, language));
    }
    const id = this.nextTranscribeId++;
    return new Promise<string>((resolve, reject) => {
      this.pendingTranscribes.set(id, { resolve, reject });
      this.worker!.postMessage({ type: "transcribe", id, audio, language });
    });
  }

  reset(): void {
    this.worker?.postMessage({ type: "reset" });
  }

  terminate(): void {
    const worker = this.worker;
    if (worker === undefined) {
      return;
    }
    worker.postMessage({ type: "terminate" });
    worker.terminate();
    this.worker = undefined;
    this.ready = false;
    this.pendingLoad = undefined;
    this.onProgress = undefined;
    for (const pending of this.pendingTranscribes.values()) {
      pending.reject(new Error("whisper backend terminated"));
    }
    this.pendingTranscribes.clear();
  }

  private ensureWorker(): Worker {
    if (this.worker !== undefined) {
      return this.worker;
    }
    const worker = new Worker(
      new URL("./WhisperWorker.ts", import.meta.url),
      { type: "module" },
    );
    worker.addEventListener(
      "message",
      (event: MessageEvent<WhisperWorkerOutboundMessage>) => {
        this.onWorkerMessage(event.data);
      },
    );
    worker.addEventListener("error", () => {
      this.failPending(new Error("whisper worker crashed"));
    });
    this.worker = worker;
    return worker;
  }

  private onWorkerMessage(message: WhisperWorkerOutboundMessage): void {
    if (message.type === "progress") {
      this.onProgress?.(message.ratio);
      return;
    }
    if (message.type === "ready") {
      this.ready = true;
      this.pendingLoad?.resolve();
      this.pendingLoad = undefined;
      return;
    }
    if (message.type === "result") {
      const pending = this.pendingTranscribes.get(message.id);
      this.pendingTranscribes.delete(message.id);
      pending?.resolve(message.text);
      return;
    }
    const id = message.id;
    const pending = id === undefined
      ? undefined
      : this.pendingTranscribes.get(id);
    if (id !== undefined && pending !== undefined) {
      this.pendingTranscribes.delete(id);
      pending.reject(new Error(message.message));
      return;
    }
    this.pendingLoad?.reject(new Error(message.message));
    this.pendingLoad = undefined;
  }

  private failPending(error: Error): void {
    this.pendingLoad?.reject(error);
    this.pendingLoad = undefined;
    for (const pending of this.pendingTranscribes.values()) {
      pending.reject(error);
    }
    this.pendingTranscribes.clear();
  }
}
