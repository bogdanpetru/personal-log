import { describe, expect, it } from "vitest";
import {
  AUDIO_FORMATS,
  createDownloadFile,
  extensionForMime,
  findFormat,
  isAudioFormatId,
} from "./formats";
import type { Log } from "@personal-log/plugin-api";

const log: Log = {
  id: "a",
  createdAt: "2025-01-01T10:00:00.000Z",
  durationMs: 1000,
  audio: {
    id: "a-audio",
    mimeType: "audio/webm",
    size: 10,
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  transcriptions: [],
};

const audio = new Blob(["recording"], { type: "audio/webm" });

describe("audio formats", () => {
  it("offers the native format first, then the conversions", () => {
    expect(AUDIO_FORMATS.map((format) => format.id)).toEqual([
      "original",
      "mp3",
      "wav",
      "m4a",
    ]);
  });

  it("recognises known format ids only", () => {
    expect(isAudioFormatId("mp3")).toBe(true);
    expect(isAudioFormatId("flac")).toBe(false);
    expect(findFormat("wav").mimeType).toBe("audio/wav");
  });

  it("maps a mime type to its file extension", () => {
    expect(extensionForMime("audio/webm")).toBe("webm");
    expect(extensionForMime("audio/mp4")).toBe("m4a");
    expect(extensionForMime("audio/ogg;codecs=opus")).toBe("ogg");
    expect(extensionForMime("audio/mpeg")).toBe("mp3");
    expect(extensionForMime("audio/unknown")).toBe("bin");
  });

  it("keeps the recorded file for the original format", () => {
    const file = createDownloadFile(log, audio, "original");
    expect(file.name).toMatch(
      /^personal-log-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webm$/,
    );
    expect(file.type).toBe("audio/webm");
  });

  it("names converted files after the target format", () => {
    const file = createDownloadFile(log, audio, "mp3");
    expect(file.name).toMatch(
      /^personal-log-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp3$/,
    );
    expect(file.type).toBe("audio/mpeg");
  });
});
