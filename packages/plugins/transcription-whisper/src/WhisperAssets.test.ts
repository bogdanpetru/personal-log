import { describe, expect, it } from "vitest";
import { deleteWhisperAssets, hasWhisperAssets } from "./WhisperAssets.js";

const WHISPER_URL = "https://huggingface.co/onnx-community/whisper-base/resolve/main/config.json";
const OTHER_URL = "https://huggingface.co/onnx-community/other-model/resolve/main/model.onnx";

class FakeCache {
  readonly name: string;
  readonly urls: string[] = [];

  constructor(name: string, urls: string[] = []) {
    this.name = name;
    this.urls.push(...urls);
  }

  async keys(): Promise<Request[]> {
    return this.urls.map((url) => ({ url }) as unknown as Request);
  }

  async delete(request: Request): Promise<boolean> {
    const index = this.urls.findIndex((url) => url === request.url);
    if (index === -1) return false;
    this.urls.splice(index, 1);
    return true;
  }
}

class FakeCacheStorage {
  readonly caches: FakeCache[];

  constructor(...caches: FakeCache[]) {
    this.caches = caches;
  }

  async keys(): Promise<string[]> {
    return this.caches.map((cache) => cache.name);
  }

  async open(name: string): Promise<Cache> {
    const cache = this.caches.find((entry) => entry.name === name);
    if (!cache) throw new Error(`cache "${name}" not found`);
    return cache as unknown as Cache;
  }
}

describe("WhisperAssets", () => {
  it("reports no assets when caches are empty", async () => {
    const storage = new FakeCacheStorage(new FakeCache("transformers-cache"));
    expect(await hasWhisperAssets(storage as unknown as CacheStorage)).toBe(false);
    await expect(deleteWhisperAssets(storage as unknown as CacheStorage)).resolves.toBeUndefined();
    expect(storage.caches[0].urls).toEqual([]);
  });

  it("reports assets when a whisper-repo entry exists", async () => {
    const cache = new FakeCache("transformers-cache", [WHISPER_URL]);
    expect(await hasWhisperAssets(new FakeCacheStorage(cache) as unknown as CacheStorage)).toBe(true);
  });

  it("deletes only whisper-repo entries and keeps other entries", async () => {
    const whisperCache = new FakeCache("transformers-cache", [
      WHISPER_URL,
      OTHER_URL,
      "https://huggingface.co/onnx-community/whisper-base/resolve/main/model_quantized.onnx",
    ]);
    const otherCache = new FakeCache("other-cache", [OTHER_URL]);
    const storage = new FakeCacheStorage(whisperCache, otherCache);
    await deleteWhisperAssets(storage as unknown as CacheStorage);
    expect(whisperCache.urls).toEqual([OTHER_URL]);
    expect(otherCache.urls).toEqual([OTHER_URL]);
    expect(
      await hasWhisperAssets(storage as unknown as CacheStorage),
    ).toBe(false);
  });
});
