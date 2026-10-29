import type { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
import workerURL from "@ffmpeg/ffmpeg/worker?worker&url";
import { findFormat, type ConvertedFormatId } from "./formats";

const ENCODERS: Record<ConvertedFormatId, string[]> = {
  mp3: ["-c:a", "libmp3lame", "-b:a", "192k"],
  wav: ["-c:a", "pcm_s16le"],
  m4a: ["-c:a", "aac", "-b:a", "192k"],
};

let ffmpegPromise: Promise<FFmpeg> | null = null;

function loadFFmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= import("@ffmpeg/ffmpeg").then(async ({ FFmpeg }) => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL, classWorkerURL: workerURL });
    return ffmpeg;
  });
  return ffmpegPromise;
}

export async function convertRecording(
  audio: Blob,
  format: ConvertedFormatId,
  inputExtension: string,
): Promise<Blob> {
  const target = findFormat(format);
  const input = `input.${inputExtension}`;
  const output = `output.${target.extension}`;
  const ffmpeg = await loadFFmpeg();

  await ffmpeg.writeFile(input, new Uint8Array(await audio.arrayBuffer()));
  try {
    const code = await ffmpeg.exec([
      "-y",
      "-i",
      input,
      "-vn",
      ...ENCODERS[format],
      output,
    ]);
    if (code !== 0) {
      throw new Error(`ffmpeg exited with code ${code}`);
    }
    const data = await ffmpeg.readFile(output);
    if (typeof data === "string") {
      throw new Error("ffmpeg returned text instead of audio");
    }
    return new Blob([new Uint8Array(data)], { type: target.mimeType });
  } finally {
    await ffmpeg.deleteFile(input).catch(() => undefined);
    await ffmpeg.deleteFile(output).catch(() => undefined);
  }
}
