import { describe, expect, it } from "vitest";
import type { Log } from "@personal-log/plugin-api";
import { packLogFiles, unpackLogFiles } from "./BackupArchive";
import { audioRecordingName } from "./backupFileNames";

function makeLog(id: string): Log {
  return {
    id,
    title: "walk",
    createdAt: "2026-11-02T06:00:00.000Z",
    durationMs: 1000,
    audio: {
      id: `audio-${id}`,
      mimeType: "audio/webm;codecs=opus",
      size: 4,
      createdAt: "2026-11-02T06:00:00.000Z",
    },
    transcriptions: [
      {
        id: `t-${id}`,
        logId: id,
        providerId: "native",
        createdAt: "2026-11-02T06:00:01.000Z",
        text: "hello",
      },
    ],
  };
}

describe("audioRecordingName", () => {
  it("maps mime types to stable extensions", () => {
    expect(audioRecordingName("audio/webm;codecs=opus")).toBe("recording.webm");
    expect(audioRecordingName("audio/mp4")).toBe("recording.m4a");
    expect(audioRecordingName("audio/mpeg")).toBe("recording.mp3");
    expect(audioRecordingName("audio/x-unknown")).toBe("recording.bin");
  });
});

describe("backup archive round trip", () => {
  it("packs and unpacks logs with audio intact", async () => {
    const log = makeLog("log-1");
    const zip = await packLogFiles([
      { log, audio: new Blob(["audio-bytes"], { type: log.audio.mimeType }) },
      { log: makeLog("log-2"), audio: new Blob(["other"], { type: "audio/webm" }) },
    ]);

    const entries = unpackLogFiles(zip);

    expect(entries).toHaveLength(2);
    const first = entries.find((entry) => entry.log.id === "log-1");
    expect(first?.log).toEqual(log);
    expect(first?.audio.type).toBe("audio/webm;codecs=opus");
    expect(await first?.audio.text()).toBe("audio-bytes");
  });

  it("skips entries with missing or corrupt parts", async () => {
    const zip = await packLogFiles([
      { log: makeLog("ok"), audio: new Blob(["a"]) },
    ]);
    const broken = zip.slice(0, Math.floor(zip.length / 2));

    expect(() => unpackLogFiles(broken)).toThrow();
  });

  it("skips metadata that is not a log", async () => {
    const { zipSync, strToU8 } = await import("fflate");
    const zip = zipSync({
      "logs/bad/metadata.json": strToU8('{"id": 5}'),
      "logs/bad/recording.webm": new Uint8Array([1, 2]),
      "notes.txt": strToU8("ignore me"),
    });

    expect(unpackLogFiles(zip)).toEqual([]);
  });
});
