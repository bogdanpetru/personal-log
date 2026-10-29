# PL-15 — Settings page, default language and download formats

## Goal

A settings screen where the user picks the default transcription language and
the format recordings are downloaded/shared in. In view mode the format can
be switched right next to the share button; non-native formats are produced by
FFmpeg.wasm, loaded only when such a format is actually used.

## Tech stack

- **Conversion:** FFmpeg.wasm (`@ffmpeg/ffmpeg` + `@ffmpeg/core`), dynamically
  imported and loaded on the first non-native conversion. Core JS + wasm are
  served from our own build (`?url` assets); the class worker is bundled by
  Vite (`?worker&url`). Original recordings are never converted or replaced.
- **Settings:** `localStorage` behind a small store + `useSettings` hook
  (`useSyncExternalStore`), so every screen sees the same values.
- **Format pickers:** shadcn `Select` (Radix Select) added to the UI lib.
- **Formats:** Original (native, no conversion), MP3, WAV, M4A.

## Scope

- New `/settings` route with a gear entry in the log list header and a back
  button; two sections only:
  - **Default language** — the existing `LanguageSelector`.
  - **Download format** — Original / MP3 / WAV / M4A, persisted.
- The recorder starts with the saved default language; changing the language
  in the recorder stays a per-session choice.
- View mode header gets a format dropdown next to Share, preselected from the
  settings default. Choosing a format converts in the background; Share is
  disabled while converting, so the share sheet opens on the ready file.
- Share/download hands out the chosen format; Original is the recorded file
  untouched. A failed conversion falls back to the original file with a short
  notice instead of an error state.
- The stored recording and its metadata are not modified by downloading.
- `features/braindump/ideas.md` marks the format idea as implemented.
- Tests: settings store, file naming/format lookup, Settings view, Share button
  with a ready file and busy state, Log view format selector.

## References

- `features/braindump/ideas.md` (original idea text)
- `apps/web/src/views/LogView/components/ShareButton.tsx`
- `apps/web/src/views/LogView/LogView.tsx`
- `apps/web/src/views/components/LanguageSelector.tsx`
- `apps/web/src/App.tsx`
