import { loadWhisperPipeline } from "./WhisperModel.js";
import type {
  WhisperWorkerInboundMessage,
  WhisperWorkerOutboundMessage,
} from "./WhisperWorkerProtocol.js";

type WorkerScope = {
  postMessage(message: WhisperWorkerOutboundMessage): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WhisperWorkerInboundMessage>) => void,
  ): void;
  close(): void;
};

interface WhisperOutput {
  text: string;
}

let pipeline: Awaited<ReturnType<typeof loadWhisperPipeline>> | undefined;

function outputText(output: unknown): string {
  if (Array.isArray(output)) {
    return (output[0] as WhisperOutput).text ?? "";
  }
  return (output as WhisperOutput).text ?? "";
}

const scope = self as unknown as WorkerScope;

scope.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "load") {
    loadWhisperPipeline((ratio) => {
      scope.postMessage({ type: "progress", ratio });
    })
      .then((loaded) => {
        pipeline = loaded;
        scope.postMessage({ type: "ready" });
      })
      .catch((error: unknown) => {
        scope.postMessage({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return;
  }
  if (message.type === "transcribe") {
    void (async () => {
      if (pipeline === undefined) {
        throw new Error("whisper pipeline is not loaded");
      }
      return await pipeline(message.audio, { language: message.language });
    })()
      .then((output) => {
        scope.postMessage({
          type: "result",
          id: message.id,
          text: outputText(output),
        });
      })
      .catch((error: unknown) => {
        scope.postMessage({
          type: "error",
          id: message.id,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return;
  }
  if (message.type === "reset") {
    return;
  }
  if (message.type === "terminate") {
    scope.close();
  }
});
