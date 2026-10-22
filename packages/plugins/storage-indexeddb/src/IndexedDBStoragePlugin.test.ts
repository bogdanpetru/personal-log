import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test } from "vitest";
import type { Log } from "@personal-log/plugin-api";
import { IndexedDBStoragePlugin } from "./IndexedDBStoragePlugin";

function makeLog(id: string, createdAt: string, text: string): Log {
  return {
    id,
    createdAt,
    durationMs: 1500,
    audio: {
      id: `${id}-audio`,
      mimeType: "audio/webm",
      size: text.length,
      createdAt,
      blob: new Blob([text]),
    },
    transcriptions: [
      {
        id: `${id}-transcription`,
        logId: id,
        providerId: "test",
        createdAt,
        text,
      },
    ],
  };
}

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("personal-log");
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("failed to delete database"));
    request.onblocked = () => resolve();
  });
}

let storage: IndexedDBStoragePlugin;

beforeEach(async () => {
  await deleteDatabase();
  storage = new IndexedDBStoragePlugin();
});

afterEach(async () => {
  await storage.dispose();
});

test("save and get roundtrip, audio blob included", async () => {
  await storage.initialize();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log);

  const restored = await storage.get("a");
  expect(restored).toEqual(log);
  expect(restored!.audio.blob).toBeInstanceOf(Blob);
});

test("get of a missing id is undefined", async () => {
  expect(await storage.get("nope")).toBeUndefined();
});

test("list is ordered oldest-first by createdAt", async () => {
  await storage.save(makeLog("newest", "2026-01-03T00:00:00Z", "3"));
  await storage.save(makeLog("oldest", "2026-01-01T00:00:00Z", "1"));
  await storage.save(makeLog("middle", "2026-01-02T00:00:00Z", "2"));
  const ids = (await storage.list()).map((log) => log.id);
  expect(ids).toEqual(["oldest", "middle", "newest"]);
});

test("save overwrites the same id", async () => {
  await storage.save(makeLog("a", "2026-01-01T00:00:00Z", "one"));
  await storage.save(makeLog("a", "2026-01-02T00:00:00Z", "two"));
  const logs = await storage.list();
  expect(logs).toHaveLength(1);
  expect(logs[0]!.transcriptions[0]!.text).toBe("two");
});

test("delete removes the log", async () => {
  await storage.save(makeLog("a", "2026-01-01T00:00:00Z", "hello"));
  await storage.delete("a");
  expect(await storage.get("a")).toBeUndefined();
  expect(await storage.list()).toEqual([]);
});

test("dispose closes the connection; reopening still reads persisted data", async () => {
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log);
  await storage.dispose();
  // The connection closed, but the data is durable: a fresh open reads it.
  expect(await storage.get("a")).toEqual(log);
});