import type { ProgressInfo } from "@huggingface/transformers";

const DOWNLOAD_RATIO_CAP = 0.99;

export function createWhisperProgressTracker(
  expectedBytes: number,
  onProgress?: (ratio: number) => void,
): (info: ProgressInfo) => void {
  const downloadedByFile = new Map<string, number>();
  let peak = 0;

  return (info) => {
    if (!onProgress) {
      return;
    }
    if (info.status === "ready") {
      peak = 1;
      onProgress(peak);
      return;
    }
    if (
      info.status === "progress" &&
      Number.isFinite(info.total) &&
      info.total > 0
    ) {
      downloadedByFile.set(info.file, Math.min(info.loaded, info.total));
    }
    let downloaded = 0;
    for (const bytes of downloadedByFile.values()) {
      downloaded += bytes;
    }
    const ratio = Math.min(DOWNLOAD_RATIO_CAP, downloaded / expectedBytes);
    if (ratio > peak) {
      peak = ratio;
      onProgress(peak);
    }
  };
}
