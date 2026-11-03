import { describe, expect, it } from "vitest";
import type { Log, LogData } from "@personal-log/plugin-api";
import { exportBackup } from "./exportBackup";
import { unzipSync } from "fflate";

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

function fakeCore(logs: Log[]) {
  return {
    async getLogs(query?: { skip?: number; limit?: number }) {
      const { skip = 0, limit = 50 } = query ?? {};
      return logs.slice(skip, skip + limit);
    },
    async getLogData(logId: string): Promise<LogData | undefined> {
      return logs.some((log) => log.id === logId)
        ? { logId, audio: new Blob([`audio-of-${logId}`]) }
        : undefined;
    },
  };
}

describe("exportBackup", () => {
  it("packs every log with its audio into a dated zip file", async () => {
    const logs = [makeLog("log-1"), makeLog("log-2")];
    const file = await exportBackup(fakeCore(logs));

    expect(file.name).toMatch(/^personal-log-backup-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(file.type).toBe("application/zip");

    const unzipped = unzipSync(new Uint8Array(await file.arrayBuffer()));
    expect(Object.keys(unzipped).sort()).toEqual([
      "logs/log-1/metadata.json",
      "logs/log-1/recording.webm",
      "logs/log-2/metadata.json",
      "logs/log-2/recording.webm",
    ]);
  });

  it("pages through all logs instead of stopping at the default page size", async () => {
    const logs = Array.from({ length: 130 }, (_, index) => makeLog(`log-${index}`));
    const file = await exportBackup(fakeCore(logs));

    const unzipped = unzipSync(new Uint8Array(await file.arrayBuffer()));
    expect(
      Object.keys(unzipped).filter((path) => path.endsWith("metadata.json")),
    ).toHaveLength(130);
  });
});
