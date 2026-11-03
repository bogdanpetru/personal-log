import { createWhisperProgressTracker } from "./WhisperDownloadProgress.js";

export const WHISPER_MODEL_ID = "onnx-community/whisper-base";
export const WHISPER_TASK = "automatic-speech-recognition" as const;
export const WHISPER_WASM_DTYPE = "q8" as const;
export const WHISPER_WEBGPU_DTYPE = {
  encoder_model: "fp32",
  decoder_model_merged: "q4",
} as const;
export const WHISPER_SAMPLE_RATE = 16000;
export const WHISPER_CHUNK_SECONDS = 5;
export const WHISPER_WEBGPU_BYTES = 210_000_000;
export const WHISPER_WASM_BYTES = 81_000_000;

type WhisperDevice = "webgpu" | "wasm";

type WhisperPipeline = Awaited<ReturnType<typeof createPipeline>>;

function createPipeline(
  device: WhisperDevice,
  onProgress?: (ratio: number) => void,
) {
  const expectedBytes =
    device === "webgpu" ? WHISPER_WEBGPU_BYTES : WHISPER_WASM_BYTES;
  return import("@huggingface/transformers").then((transformers) =>
    transformers.pipeline(WHISPER_TASK, WHISPER_MODEL_ID, {
      progress_callback: createWhisperProgressTracker(
        expectedBytes,
        onProgress,
      ),
      device,
      dtype: device === "webgpu" ? WHISPER_WEBGPU_DTYPE : WHISPER_WASM_DTYPE,
    }),
  );
}

function selectedDevice(): WhisperDevice {
  return "gpu" in navigator ? "webgpu" : "wasm";
}

export async function loadWhisperPipeline(
  onProgress?: (ratio: number) => void,
): Promise<WhisperPipeline> {
  try {
    return await createPipeline(selectedDevice(), onProgress);
  } catch (error) {
    if (selectedDevice() === "wasm") {
      throw error;
    }
    return await createPipeline("wasm", onProgress);
  }
}
