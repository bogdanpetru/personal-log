# PL-20 — Backup & restore — execution plan

Derived from `spec.md`. Bite-size steps; each states the change, the files,
and the verifiable outcome. Follow AGENTS.md: barrels only re-export, one
named thing per file, no comments.

## Steps

- [x] 1. **`apps/web/src/lib/backup/BackupArchive.ts`** — pure zip helpers
  around `fflate`: `packLogFiles(logs: { metadata: Log; audio: Blob }[])`
  → `Uint8Array` zip (store mode: `logs/<logId>/metadata.json` +
  `logs/<logId>/recording.<ext>`) and `unpackLogFiles(zip: Uint8Array)` →
  the same shape, ignoring corrupt/unknown entries. File-name helpers and
  the audio-extension mapping live here (own file `backupFileNames.ts` if it
  grows). Unit tests with faked audio blobs. Verify: `pnpm -F web test`
  green.

- [x] 2. **`apps/web/src/lib/backup/exportBackup.ts`** — reads `core.getLogs()`
  + `core.getLogData(id)`, builds the zip via `packLogFiles`, returns a
  `File` named `personal-log-backup-<date>.zip`. Unit test with a fake core.
  Verify: app tests green.

- [x] 3. **`apps/web/src/lib/backup/restoreBackup.ts`** — takes a `File`,
  unzips, for each entry skips ids already in storage
  (`storage.get(logId)`), calls `storage.save(log, { logId, audio })` for
  the rest, returns `{ imported: number; skipped: number }`. Unit test with
  a fake StoragePlugin. Verify: app tests green.

- [x] 4. **`apps/web/src/lib/backup/shareBackupFile.ts`** — if
  `navigator.canShare({ files: [file] })`, share; else trigger an anchor
  download. Thin, browser-only — manual verification later.

- [x] 5. **Settings UI** — `apps/web/src/views/SettingsView/components/BackupSection.tsx`:
  Export button (progress/error text while packing), Restore button
  (hidden file input), status line showing the `{imported, skipped}` result.
  Needs the shared storage instance + core from `usePersonalLog` /
  `apps/web/src/lib/storage` wiring. Unit test for the view section. Verify:
  Settings view tests green.

- [x] 6. **i18n** — keys for the section (labels, status, errors) in **all 21
  locale files** with English placeholders, matching the PL-19 approach.
  Verify: typecheck + app tests green.

- [x] 7. **Wire storage sharing** — hoist the `OpfsStoragePlugin` instance out
  of `usePersonalLog.ts` into a singleton (`apps/web/src/lib/storage.ts` or
  existing lib) so `restoreBackup` writes into the exact store core reads
  from; reload state after restore. Verify: app tests green; recordings made
  before restore and restored logs both list.

- [x] 8. **Add `fflate`** to `apps/web` dependencies; `pnpm install`. Verify:
  lockfile updated, build passes.

- [x] 9. **Full verification**: `pnpm -r test` and `pnpm -r typecheck`.
  Verify: all green.

- [ ] 10. **Manual browser checklist** (report outcomes): export a few
  recordings → zip downloads; on a second profile/private window restore
  imports them; re-export/re-import skips existing; iOS Safari share sheet
  appears (if device handy) — otherwise note desktop-only verification.

- [ ] 11. **Commit (held)** — `PL-20: backup & restore all logs as a zip from settings`.
  Stop before executing; run only after the user's approval.
