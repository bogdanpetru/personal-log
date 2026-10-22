# PL-6 — Storage refactor: async storage interface + OPFS plugin

## Goal

Recordings live in the browser's secure private file system (OPFS) instead of
IndexedDB, behind a redesigned storage-plugin interface that is minimal but
extensible enough that a remote personal-server plugin (PL-7) can later
implement it without another redesign. The IndexedDB storage plugin is
dropped.

## Tech stack

- **Storage backend:** OPFS (Origin Private File System) — origin-private,
  quota-aware, built for file I/O; inspectable in Chrome devtools (Storage →
  Origin private file system). One new plugin package:
  `@personal-log/plugin-storage-opfs`.
- **Interface:** in `@personal-log/plugin-api` — async everywhere, hiding all
  implementation details (a plugin consumer cannot tell OPFS from a remote
  server).
- **Dropped:** `packages/plugins/storage-indexeddb` is deleted. No data
  migration — the app is pre-release and its IndexedDB logs are throwaway.
- **Deferred:** download/export is the next ticket; this item only prepares
  for it (the interface exposes the audio payload and transcript text it
  needs).

## The API contract

Metadata and data are split — listing logs stays cheap, the audio blob is
fetched on demand:

```ts
// Log = metadata, cheap to list and page. No blob anywhere on it.
interface Log {
  id: LogId;
  createdAt: string;
  durationMs: number;
  audio: AudioArtifact; // id, mimeType, size, createdAt
  transcriptions: TranscriptionArtifact[]; // text included — it is small
}

// LogData = the heavy payload, fetched on demand.
interface LogData {
  logId: LogId;
  audio: Blob;
}

interface LogQuery {
  skip?: number; // default 0
  limit?: number; // default 50
  include?: { transcriptions?: boolean }; // false → cheap metadata-only list
  filter?: LogFilter;
}

// Minimal and extensible: all fields optional, more can be added later.
interface LogFilter {
  search?: string; // substring in transcription text
  from?: string; // createdAt >=
  to?: string; // createdAt <
}

interface StoragePlugin {
  id: string;
  name: string;
  initialize(): Promise<void>;
  getLogs(query?: LogQuery): Promise<Log[]>; // oldest-first
  get(logId: LogId): Promise<Log | undefined>;
  getLogData(logId: LogId): Promise<LogData | undefined>;
  save(log: Log, data: LogData): Promise<void>;
  delete(logId: LogId): Promise<void>;
  dispose(): Promise<void>;
}
```

`AudioArtifact` loses its `blob` field (metadata only); `LogData` carries the
audio instead.

## Scope

- **`@personal-log/plugin-api`** — the interfaces and data-model split above.
- **`@personal-log/plugin-storage-opfs`** — the simple data structure from the
  architecture braindump:
  ```text
  OPFS/
    logs/
      <log-id>/
        recording.<ext>   ← the audio, the source of truth
        metadata.json     ← the Log metadata incl. transcriptions
  ```
  `save` writes both files (extension derived from the audio mime type),
  `getLogs` reads metadata files and applies sort → filter → skip/limit
  in memory, `get` reads one log's metadata, `getLogData` reads the recording
  file back into a Blob, `delete` removes the whole directory, `dispose`
  closes the OPFS handle.
- **`@personal-log/core`** — `PersonalLog` adapts: `stop()` builds
  `(log, data)` and saves both; the `recorded` event hands the UI
  `(log, data)` so playback of the just-finished recording needs no re-fetch;
  the passthrough queries become `getLogs(query?)`, `getLog(id)`,
  `getLogData(id)`, `deleteLog(id)` (replacing `getRecordings` /
  `deleteRecording`); `storage` stays optional (absent → logs are not
  persisted, `getLogs()` is `[]`).
- **`apps/web`** — wires the OPFS plugin in `usePersonalLog`; the playback URL
  comes from the `recorded` event's `data` as today. UI is otherwise
  unchanged.
- **Delete** `packages/plugins/storage-indexeddb`.

Later work items add: download/export of recordings (this interface already
exposes what it needs), the remote personal-server storage plugin (Ed25519
key pair or signed API token; PL-7), the recordings-list UI over `getLogs`.

## Rules that must survive the refactor

- The recording is the source of truth; the transcription is a derived
  artifact.
- No data leaves the device; no network calls are introduced.
- A `StoragePlugin` consumer must not be able to tell which backend is behind
  the interface.

## References

- `features/braindump/arhitecture.md` §4 (local storage: OPFS layout, metadata
  vs recordings), §8–9 (storage plugin system, personal server)
- `features/PL-5-headless-core/spec.md` — the plugin architecture this builds on
- `packages/plugin-api` — current `StoragePlugin`/`Log`/`AudioArtifact` being
  redesigned
- `packages/core/src/PersonalLog.ts` — the save path and queries being adapted