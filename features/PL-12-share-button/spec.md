# PL-12 — Share button

## Goal

In view mode a share button hands the recording's audio file to the OS share sheet, so the user can send it wherever they choose (messaging, files, mail, AirDrop…). Where the share sheet cannot take files, the button saves the recording as a file instead (download).

## Tech stack

- **Sharing:** Web Share API Level 2 — `navigator.canShare`/`navigator.share` with a `File`; no share-target polyfills.
- **Fallback:** a programmatic anchor download of the same object URL already used for playback.
- **Audio source:** the playback `Blob` kept by `usePersonalLog` (from the `"recorded"` event and `loadLogData`) — no re-fetch.
- **UI:** shadcn `Button` (ghost icon) + lucide `Share2`, inside `views/LogView/components/` per the layering rules.

## Scope

View mode (a stored log or a just-recorded one — both render `LogView`) gains the share affordance.

- **Share button:** in the `LogView` header, right side (alongside the language label); ghost icon button, aria-labelled.
- **Share payload:** the audio as a `File` named from the log's `createdAt` timestamp and extension from `log.audio.mimeType` (e.g. `personal-log-2025-01-01_10-00-00.webm`).
- **Behavior:** when `navigator.canShare({ files })` allows it, open the share sheet; user cancellation ends quietly; a real share failure falls through to the download. When sharing files is unsupported, download directly.
- **Hook change:** `usePersonalLog` exposes the playback `Blob` alongside `playbackSrc` (set on `"recorded"` and in `loadLogData`, cleared where the URL is cleared).
- **Both paths tested:** component test covers the unsupported-share download fallback and the accessible name.

## References

- Share request from the conversation.
- `apps/web/src/views/LogView/` and `apps/web/src/hooks/usePersonalLog.ts` from PL-10.