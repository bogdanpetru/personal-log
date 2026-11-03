# PL-20 — Backup & restore

## Goal

In Settings, export every log (audio + transcripts) as one zip file — saved
anywhere via the native share sheet on mobile or as a download on desktop —
and restore logs back from such a zip. Works on iOS, Android, and desktop
with zero accounts, zero API keys, zero setup.

## Direction history

This ticket started as a Google Drive storage plugin (OAuth web client,
`drive.file` scope, auto-upload on save). That was reversed: the Google
Cloud registration is too much setup. The pick-a-folder (File System Access
API) sync replacement was also reversed: it must work on mobile, and no
mobile browser supports directory picking. Manual backup/restore is the
agreed direction.

## Tech stack

- **Zip:** `fflate` (`zipSync`/`unzipSync`) — small, no WASM
- **Share:** Web Share API with files (`navigator.canShare`), falling back to a classic download anchor
- **Data access:** export reads through core (`getLogs`, `getLogData`); restore writes through the shared `OpfsStoragePlugin` instance
- **Zip layout:** `logs/<logId>/metadata.json` (serialized `Log`) + `logs/<logId>/recording.<ext>`

## Scope

The app already persists logs locally in OPFS and has Share/download flows.

- Settings "Backup" section: Export button and Restore picker with status text
- Export: all logs packed into one zip, offered via share sheet (mobile) or download (desktop)
- Restore: zip file picker, imports logs whose ids are not present locally (no overwrites), reports how many were imported and skipped
- Everything local: no network, nothing leaves the device except the user-chosen share destination

## References