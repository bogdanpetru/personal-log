# PL-6 — Storage refactor: async storage interface + OPFS plugin

## Goal

Logs persist in OPFS behind the redesigned minimal-but-extensible storage
interface (metadata/data split, paged `getLogs`, lazy `getLogData`). The
IndexedDB plugin is deleted. The app behaves as before from the user's side.
Definition of done: `pnpm build`, `pnpm test`, `pnpm typecheck`, and lint all
pass across the repo.

## Architecture

- **`@personal-log/plugin-api`** — the interface from the spec's "API
  contract" section, implemented verbatim: `Log`/`AudioArtifact` lose the blob,
  `LogData` carries it, `LogQuery`/`LogFilter` (search/from/to, all optional),
  `StoragePlugin` with `getLogs/get/getLogData/save(log, data)/delete/dispose`.
- **`@personal-log/plugin-storage-opfs`** — `OpfsStoragePlugin` with the
  spec's directory structure: `logs/<log-id>/recording.<ext>` (extension from
  the audio mime type) + `metadata.json` (the `Log`, plain JSON — no blob
  anywhere in it). `getLogs` reads all metadata files, then sort → filter →
  skip/limit in memory; `include.transcriptions === false` strips them.
- **`@personal-log/core`** — `PersonalLog.stop()` builds `(log, data)` and
  saves both; the `recorded` event emits `(log, data)` so the app's playback
  needs no re-fetch; passthrough queries `getLogs(query?)`, `getLog(id)`,
  `getLogData(id)`, `deleteLog(id)` replace `getRecordings`/`deleteRecording`.
  Storage stays optional.
- **`apps/web`** — wires `OpfsStoragePlugin` in `usePersonalLog`; the playback
  URL now comes from the `recorded` event's `data`. UI otherwise unchanged.
- **Deleted:** `packages/plugins/storage-indexeddb`.

## Ground rules

- Work from the repo root. Do steps in order. Each step has a **Done when**
  check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this
  file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix
  options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and
  report the prepared commit (exact command + message); the orchestrator asks
  the user for approval.

## Steps

### 1. [x] `@personal-log/plugin-api`: storage interface redesign

Data-model split and new interfaces exactly per the spec's API contract:
`AudioArtifact` without `blob`, new `LogData`, `LogQuery`, `LogFilter`, and the
new `StoragePlugin`; all exported through the barrel. `Recording` (the
recorder's output) is unchanged — it still carries the blob.

**Done when:** `pnpm -C packages/plugin-api typecheck` passes.

### 2. [x] Scaffold `packages/plugins/storage-opfs`

Package files mirroring the sibling plugin packages: package.json
(`@personal-log/plugin-storage-opfs`, dependency on plugin-api), tsconfig,
vitest config (node environment), empty src barrel. `pnpm install` links it.

**Done when:** `pnpm install` succeeds and `pnpm -C packages/plugins/storage-opfs typecheck` passes.

### 3. [x] `OpfsStoragePlugin` + tests

Implementation per the architecture section (lazy `logs` directory handle,
metadata.json, recording file, in-memory sort → filter → skip/limit,
`include.transcriptions`, dispose drops the handle). Test it against a
minimal in-memory OPFS fake (a `FileSystemDirectoryHandle`-compatible fake
stubbed in via `navigator.storage.getDirectory`) covering at a high level:
save/get roundtrip, getLogData returning the audio, pagination + filter
(search/from/to) + `include.transcriptions: false`, delete, missing ids →
undefined, dispose.

**Done when:** `pnpm -C packages/plugins/storage-opfs test` and `typecheck` pass.

### 4. [x] `@personal-log/core` adapts to the new interface

`recorded` event becomes `(log, data)`; `stop()` saves via
`save(log, data)`; `buildLog` produces the pair; passthrough queries
`getLogs`/`getLog`/`getLogData`/`deleteLog` replace `getRecordings`/
`deleteRecording`; storage optional (absent → `getLogs()` is `[]`). Update the
core tests: fake storage implements the new interface; cover at a high level:
the recorded pair (metadata without blob, data with it), save wiring, the
queries passthrough, and no-storage mode.

**Done when:** `pnpm -C packages/core test` and `typecheck` pass.

### 5. [x] `apps/web` swaps to the OPFS plugin

Dependency swap in `apps/web/package.json`; `usePersonalLog` constructs
`OpfsStoragePlugin` and builds the playback URL from the `recorded` event's
`data`. Components and UX unchanged.

**Done when:** `pnpm -C apps/web typecheck`, `test`, and `lint` pass.

### 6. [x] Delete `packages/plugins/storage-indexeddb`

Remove the package directory and run `pnpm install` to update the lockfile.

**Done when:** the directory is gone, `pnpm install` succeeds, and
`pnpm -r --if-present typecheck` passes.

### 7. [x] Full verification

From the repo root: `pnpm build && pnpm test && pnpm typecheck && pnpm -r --if-present lint`. Start the preview server in the background and confirm it
serves (curl the root for HTTP 200).

**Done when:** all commands pass and the preview responds 200.

### 8. [x] Browser checklist (report back — the user verifies)

- Record → live transcript → pause inserts a paragraph break → resume
  appends → stop → playback row appears as before.
- Devtools → Application → Storage → Origin private file system: a
  `logs/<uuid>/` directory with `recording.webm` and `metadata.json` after the
  first recording.
- IndexedDB is absent (the old `personal-log` database may linger from earlier
  sessions; no new data is written to it).
- Reload resets the app state to the initial screen, as before.

### 9. [x] Commit (held)

`git add apps/web packages pnpm-lock.yaml features/PL-6-opfs-storage && git commit -m "PL-6: async storage interface with OPFS plugin"`

Stop before running it. Report the prepared commit; the orchestrator asks the
user for approval and runs it.