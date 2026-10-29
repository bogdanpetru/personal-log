# PL-14 — Plan

Each step is independently verifiable; typecheck/tests at the end cover all.

## Data model & persistence

- [x] 1. `packages/plugin-api/src/Log.ts`: add optional `title?: string` to `Log`.
- [x] 2. `packages/plugin-api/src/StoragePlugin.ts`: add `update(log: Log): Promise<void>`.
- [x] 3. `packages/plugins/storage-opfs/src/OpfsStoragePlugin.ts`: extract the
      metadata write into a private `writeMetadata(dir, log)` helper; use it in
      `save` and in the new `update(log)` (metadata only, audio untouched).
- [x] 4. `packages/core/src/PersonalLog.ts`: add `setTitle(title)` (captured for
      the next `stop`), `renameLog(logId, title)` (load → set title → storage
      `update` → return the updated log), include `title` in `buildLog`, and
      clear it after a stop. Keep `record()` untouched so a title set before
      `record()` survives.

## Core & hook tests

- [x] 5. `packages/core/src/PersonalLog.test.ts`: `FakeStorage.update` (metadata
      only); tests: a title set before `stop` lands in the saved log, and
      `renameLog` persists a new title.
- [x] 6. `apps/web/src/hooks/usePersonalLog.ts`: expose
      `renameLog(logId, title)` delegating to the core.

## Title in the UI

- [x] 7. `apps/web/src/lib/logTitle.ts`: `formatTitle(log)` (the current
      `toLocaleString("sv")` formatting) and `logTitle(log)` = stored title or
      fallback; unit test for both.
- [x] 8. Move `views/RecorderView/components/RecordingTitle.tsx` to
      `views/components/RecordingTitle.tsx`; update the RecorderView import and
      wire its title commits to `core.setTitle` (and `renameLog` in the
      post-recording playback branch).
- [x] 9. `apps/web/src/App.tsx`: refresh logs on pathname change so a renamed
      title is visible in the list after going back.

## Playback controls

- [x] 10. Add `apps/web/src/components/Slider.tsx` (shadcn-style Radix Slider)
      and list it in the README component/guard lists.
- [x] 11. `views/PlaybackView/components/PlayButton.tsx` (play/pause at the
      left of the seek row, 50% over the original size), `PlaybackTime.tsx` (large elapsed + muted total,
      `m:ss`), `SeekBar.tsx` (controlled Slider, disabled until duration known).
- [x] 12. Rewrite `PlaybackView.tsx`: full-width column (time, seek bar, play
      button), duration = finite media duration or `durationMs` fallback,
      `onValueChange` seeks the audio element.

## Screens

- [x] 13. `LogView.tsx`: full-width title row under the controls — editable
      `RecordingTitle` (commits via new `onRename` prop) + language `Badge`;
      remove language from the header; pass `durationMs`.
- [x] 14. `LogViewRoute.tsx`: pass `onRename` that calls `renameLog` and updates
      the loaded log's title locally.
- [x] 15. `LogListView.tsx` + `App.test.tsx`: use `logTitle` so stored titles
      show in the list.
- [x] 16. Add `views/PlaybackView/PlaybackView.test.tsx` (play button + seek
      slider render, duration fallback shown) and a LogView title-edit test.

## Verify

- [x] 17. `pnpm -r typecheck`, `pnpm --filter web test`, `pnpm --filter web lint`.
