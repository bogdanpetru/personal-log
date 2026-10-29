import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Log, LogData } from "@personal-log/plugin-api";
import { OpfsStoragePlugin } from "./OpfsStoragePlugin";
import { recordingFile } from "./recordingFile";

// ---- A minimal in-memory OPFS (the slice of the FileSystem API the plugin uses)

function notFound(): Error {
  const error = new Error("not found");
  error.name = "NotFoundError";
  return error;
}

class FakeWritableFileStream {
  private readonly chunks: (string | Blob)[] = [];

  constructor(private readonly handle: FakeFileHandle) {}

  async write(chunk: string | Blob): Promise<void> {
    this.chunks.push(chunk);
  }

  async close(): Promise<void> {
    this.handle.blob = new Blob(this.chunks);
  }
}

class FakeFileHandle {
  readonly kind = "file" as const;

  constructor(
    readonly name: string,
    public blob: Blob,
  ) {}

  async getFile(): Promise<File> {
    return new File([this.blob], this.name, { type: this.blob.type });
  }

  async createWritable(): Promise<FakeWritableFileStream> {
    return new FakeWritableFileStream(this);
  }
}

class FakeDirectoryHandle {
  readonly kind = "directory" as const;
  readonly dirs = new Map<string, FakeDirectoryHandle>();
  readonly files = new Map<string, FakeFileHandle>();

  constructor(readonly name: string) {}

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FakeDirectoryHandle> {
    let dir = this.dirs.get(name);
    if (dir === undefined) {
      if (options?.create !== true) {
        throw notFound();
      }
      dir = new FakeDirectoryHandle(name);
      this.dirs.set(name, dir);
    }
    return dir;
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FakeFileHandle> {
    let file = this.files.get(name);
    if (file === undefined) {
      if (options?.create !== true) {
        throw notFound();
      }
      file = new FakeFileHandle(name, new Blob());
      this.files.set(name, file);
    }
    return file;
  }

  async removeEntry(
    name: string,
    options?: { recursive?: boolean },
  ): Promise<void> {
    if (this.dirs.has(name)) {
      if (options?.recursive !== true) {
        throw new Error("directory not empty");
      }
      this.dirs.delete(name);
      return;
    }
    if (this.files.delete(name)) {
      return;
    }
    throw notFound();
  }

  async *entries(): AsyncIterableIterator<
    [string, FakeFileHandle | FakeDirectoryHandle]
  > {
    for (const dir of this.dirs.values()) {
      yield [dir.name, dir];
    }
    for (const file of this.files.values()) {
      yield [file.name, file];
    }
  }
}

let root: FakeDirectoryHandle;

beforeEach(() => {
  root = new FakeDirectoryHandle("root");
  vi.stubGlobal("navigator", {
    storage: { getDirectory: () => Promise.resolve(root) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---- Fixtures

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

function makeData(log: Log, text: string): LogData {
  return { logId: log.id, audio: new Blob([text], { type: "audio/webm" }) };
}

// ---- Tests

test("save and get roundtrip the metadata", async () => {
  const storage = new OpfsStoragePlugin();
  await storage.initialize();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  expect(await storage.get("a")).toEqual(log);
  expect((await storage.get("a"))!.audio).not.toHaveProperty("blob");
});

test("updateMetadata rewrites the metadata and keeps the audio", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  await storage.updateMetadata({ ...log, title: "Renamed" });

  expect((await storage.get("a"))?.title).toBe("Renamed");
  expect(await (await storage.getLogData("a"))!.audio.text()).toBe("hello");
});


test("the directory holds metadata.json and the recording file", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  const logsDir = root.dirs.get("logs")!;
  const logDir = logsDir.dirs.get("a")!;
  expect([...logDir.files.keys()]).toEqual([
    "metadata.json",
    recordingFile("audio/webm"),
  ]);
  const parsed = JSON.parse(
    await logDir.files.get("metadata.json")!.blob.text(),
  );
  expect(parsed).toEqual(log);
});

test("getLogData returns the stored audio, missing ids are undefined", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  const data = await storage.getLogData("a");
  expect(data!.logId).toBe("a");
  expect(data!.audio).toBeInstanceOf(Blob);
  expect(data!.audio.type).toBe("audio/webm");
  expect(await data!.audio.text()).toBe("hello");

  expect(await storage.get("nope")).toBeUndefined();
  expect(await storage.getLogData("nope")).toBeUndefined();
});

test("getLogs pages oldest-first", async () => {
  const storage = new OpfsStoragePlugin();
  await storage.save(makeLog("b", "2026-01-02T00:00:00Z", "two"), makeData(makeLog("b", "2026-01-02T00:00:00Z", "two"), "two"));
  await storage.save(makeLog("a", "2026-01-01T00:00:00Z", "one"), makeData(makeLog("a", "2026-01-01T00:00:00Z", "one"), "one"));
  await storage.save(makeLog("c", "2026-01-03T00:00:00Z", "three"), makeData(makeLog("c", "2026-01-03T00:00:00Z", "three"), "three"));

  const all = await storage.getLogs();
  expect(all.map((log) => log.id)).toEqual(["a", "b", "c"]);
  const page = await storage.getLogs({ skip: 1, limit: 1 });
  expect(page.map((log) => log.id)).toEqual(["b"]);
});

test("getLogs filters by search and createdAt range", async () => {
  const storage = new OpfsStoragePlugin();
  for (const [id, createdAt, text] of [
    ["a", "2026-01-01T00:00:00Z", "hello world"],
    ["b", "2026-01-02T00:00:00Z", "goodbye moon"],
    ["c", "2026-01-03T00:00:00Z", "hello again"],
  ] as const) {
    const log = makeLog(id, createdAt, text);
    await storage.save(log, makeData(log, text));
  }

  const search = await storage.getLogs({ filter: { search: "hello" } });
  expect(search.map((log) => log.id)).toEqual(["a", "c"]);

  const range = await storage.getLogs({
    filter: { from: "2026-01-02T00:00:00Z", to: "2026-01-03T00:00:00Z" },
  });
  expect(range.map((log) => log.id)).toEqual(["b"]);
});

test("getLogs can strip transcriptions from a cheap listing", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  const cheap = await storage.getLogs({ include: { transcriptions: false } });
  expect(cheap).toEqual([{ ...log, transcriptions: [] }]);
});

test("a directory without readable metadata is skipped, not fatal", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  // A stray directory and a corrupt metadata file must not break the listing.
  const logsDir = root.dirs.get("logs")!;
  await logsDir.getDirectoryHandle("stray", { create: true });
  const corrupt = await logsDir.getDirectoryHandle("corrupt", { create: true });
  const metadata = await corrupt.getFileHandle("metadata.json", { create: true });
  metadata.blob = new Blob(["not json"]);

  expect((await storage.getLogs()).map((log) => log.id)).toEqual(["a"]);
});

test("delete removes the log directory; deleting a missing id is a no-op", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  await storage.delete("a");
  expect(await storage.get("a")).toBeUndefined();
  expect(await storage.getLogs()).toEqual([]);

  await expect(storage.delete("a")).resolves.toBeUndefined();
});

test("dispose drops the handle and later operations re-open lazily", async () => {
  const storage = new OpfsStoragePlugin();
  const log = makeLog("a", "2026-01-01T00:00:00Z", "hello");
  await storage.save(log, makeData(log, "hello"));

  await storage.dispose();
  expect(await storage.get("a")).toEqual(log);
});