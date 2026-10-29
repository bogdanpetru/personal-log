# PL-14 — Playback view revamp

## Goal

Opening a saved log plays it back in a layout as large and legible as the
recorder screen: a working, seekable progress bar, a big play button and
time display, and the recording title next to the language tag — editable
in play mode and saved when changed.

## Tech stack

- **Seek control:** shadcn `Slider` (Radix Slider) added to the UI lib.
- **Duration:** the recorded `Log.durationMs` as the total, because
  MediaRecorder WebM blobs report `audio.duration === Infinity` until fully
  buffered; a finite duration from the audio element wins when present.
- **Title storage:** `Log.title` persisted through a new
  `StoragePlugin.update` and `PersonalLog.renameLog`; editing reuses the
  existing `RecordingTitle` component (moved to `views/components/`).

## Scope

- The progress bar shows the real playback position, and the total time is
  known instead of `0:00`.
- Clicking or dragging the progress bar jumps to that point in the
  recording; arrow keys seek too.
- Play view layout: a large elapsed-time display (total muted beside it)
  above a full-width row holding the play/pause button (50% over its
  original size) to the left of the seek bar.
- The language tag sits next to the title on the right, in the same title
  row the recorder uses; it leaves the header (header keeps back + share).
- The title is editable in play mode and persisted; a title typed while
  recording is persisted too, and the log list shows the stored title.
- The audio-format idea is recorded in `features/braindump/ideas.md` for the
  future settings page, including a format dropdown next to the share button.
- Tests cover duration formatting, the stored-title fallback, and the
  play-mode title edit.

## References

- `apps/web/src/views/PlaybackView/PlaybackView.tsx`
- `apps/web/src/views/LogView/LogView.tsx`
- `apps/web/src/views/components/RecordingTitle.tsx` (moved from `RecorderView`)
- `packages/plugin-api/src/Log.ts`
- `packages/core/src/PersonalLog.ts`
- `packages/plugins/storage-opfs/src/OpfsStoragePlugin.ts`
- `features/braindump/ideas.md`
