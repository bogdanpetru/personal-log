import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import type { Log, LogData, StoragePlugin } from "@personal-log/plugin-api";
import { restoreBackup } from "./restoreBackup";

function makeLog(id: string): Log {
  return {
    id,
    createdAt: "2026-11-02T06:00:00.000Z",
    durationMs: 1000,
    audio: {
      id: `audio-${id}`,
      mimeType: "audio/webm",
      size: 4,
      createdAt: "2026-11-02T06:00:00.000Z",
    },
    transcriptions: [],
  };
}

class FakeStorage implements Pick<StoragePlugin, "get" | "save"> {
  readonly existing: string[];
  saved: { log: Log; data: LogData }[] = [];

  constructor(existing: string[]) {
    this.existing = existing;
  }

  async get(logId: string) {
    return this.existing.includes(logId) ? makeLog(logId) : undefined;
  }

  async save(log: Log, data: LogData) {
    this.saved.push({ log, data });
  }
}

function backupFile(ids: string[]): File {
  const files: Record<string, Uint8Array> = {};
  for (const id of ids) {
    files[`logs/${id}/metadata.json`] = strToU8(JSON.stringify(makeLog(id)));
    files[`logs/${id}/recording.webm`] = new Uint8Array([1, 2, 3]);
  }
  return new File([zipSync(files) as unknown as BlobPart], "backup.zip", {
    type: "application/zip",
  });
}

describe("restoreBackup", () => {
  it("imports missing logs and skips ids already stored", async () => {
    const storage = new FakeStorage(["log-2"]);

    const result = await restoreBackup(
      storage as unknown as StoragePlugin,
      backupFile(["log-1", "log-2", "log-3"]),
    );

    expect(result).toEqual({ imported: 2, skipped: 1 });
    expect(storage.saved.map(({ log }) => log.id)).toEqual(["log-1", "log-3"]);
  });

  it("imported audio keeps its type from the metadata", async () => {
    const storage = new FakeStorage([]);

    await restoreBackup(storage as unknown as StoragePlugin, backupFile(["log-1"]));

    expect(storage.saved[0].data.audio.type).toBe("audio/webm");
    expect(await storage.saved[0].data.audio.text()).toBe(
      new TextDecoder().decode(new Uint8Array([1, 2, 3])),
    );
  });
});
