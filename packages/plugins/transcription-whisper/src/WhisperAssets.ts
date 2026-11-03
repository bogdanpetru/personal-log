import { WHISPER_MODEL_ID } from "./WhisperModel.js";

const WHISPER_ASSET_URL_PREFIX = `https://huggingface.co/${WHISPER_MODEL_ID}/`;

function isWhisperRequest(request: Request): boolean {
  return request.url.startsWith(WHISPER_ASSET_URL_PREFIX);
}

function resolveStorage(storage?: CacheStorage): CacheStorage {
  return storage ?? window.caches;
}

function whisperEntries(cache: Cache): Promise<Request[]> {
  return cache
    .keys()
    .then((requests) => requests.filter(isWhisperRequest));
}

export async function hasWhisperAssets(storage?: CacheStorage): Promise<boolean> {
  const caches = resolveStorage(storage);
  const names = await caches.keys();
  const found = [];
  for (const name of names) {
    const cache = await caches.open(name);
    found.push(whisperEntries(cache));
  }
  const entries = await Promise.all(found);
  return entries.flat().length > 0;
}

export async function deleteWhisperAssets(storage?: CacheStorage): Promise<void> {
  const caches = resolveStorage(storage);
  const names = await caches.keys();
  for (const name of names) {
    const cache = await caches.open(name);
    const entries = await whisperEntries(cache);
    await Promise.all(entries.map((request) => cache.delete(request)));
  }
}
