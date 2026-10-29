import type { Log } from "@personal-log/plugin-api";

export type AudioFormatId = "original" | "mp3" | "wav" | "m4a";
export type ConvertedFormatId = Exclude<AudioFormatId, "original">;

export interface AudioFormat {
  id: AudioFormatId;
  label: string;
  extension: string;
  mimeType: string;
}

const FORMATS: Record<AudioFormatId, AudioFormat> = {
  original: { id: "original", label: "Original", extension: "", mimeType: "" },
  mp3: { id: "mp3", label: "MP3", extension: "mp3", mimeType: "audio/mpeg" },
  wav: { id: "wav", label: "WAV", extension: "wav", mimeType: "audio/wav" },
  m4a: { id: "m4a", label: "M4A", extension: "m4a", mimeType: "audio/mp4" },
};

export const AUDIO_FORMATS: AudioFormat[] = Object.values(FORMATS);

export function isAudioFormatId(value: string): value is AudioFormatId {
  return Object.hasOwn(FORMATS, value);
}

export function findFormat(id: AudioFormatId): AudioFormat {
  return FORMATS[id];
}

export function extensionForMime(mimeType: string): string {
  if (mimeType.includes("webm")) {
    return "webm";
  }
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  if (mimeType.includes("mpeg")) {
    return "mp3";
  }
  if (mimeType.includes("wav")) {
    return "wav";
  }
  return "bin";
}

function timestamp(createdAt: string): string {
  const date = new Date(createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const time = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
  return `${day}_${time}`;
}

export function createDownloadFile(
  log: Log,
  audio: Blob,
  format: AudioFormatId,
): File {
  const extension =
    format === "original"
      ? extensionForMime(log.audio.mimeType)
      : findFormat(format).extension;
  const mimeType =
    format === "original" ? log.audio.mimeType : findFormat(format).mimeType;
  return new File([audio], `personal-log-${timestamp(log.createdAt)}.${extension}`, {
    type: mimeType,
  });
}
