# PL-15 — Plan

## Dependencies

- [x] 1. `pnpm --filter web add @ffmpeg/ffmpeg@0.12.15 @ffmpeg/core@0.12.10`;
      confirm `vite build` accepts the `?url` core imports and `?worker&url`
      worker import.

## Settings

- [x] 2. `lib/audio/formats.ts`: `AudioFormatId`, `AUDIO_FORMATS` (label,
      extension, mimeType), `findFormat`, `downloadFile(log, format)` building
      the `File` with `personal-log-<stamp>.<ext>`.
- [x] 3. `lib/settings.ts`: `Settings { language, downloadFormat }`, defaults
      (browser language, original), localStorage read/write with validation,
      stable snapshot + subscribe, `updateSettings(patch)`.
- [x] 4. `hooks/useSettings.ts`: `useSyncExternalStore` wrapper returning
      `{ settings, updateSettings }`.
- [x] 5. `components/Select.tsx`: shadcn Radix Select primitive; add it to the
      README primitive list and guard.
- [x] 6. `views/SettingsView/` (barrel + screen): two sections as in the spec;
      gear entry in the `App.tsx` list header; `/settings` route.

## Conversion

- [x] 7. `lib/audio/convertRecording.ts`: singleton lazy FFmpeg loader
      (dynamic `@ffmpeg/ffmpeg`, static `?url` core/wasm, `?worker&url`
      worker), `convertToFile(blob, target, extension)` with encoder args for
      mp3/wav/m4a and file-system cleanup.
- [x] 8. `hooks/useDownloadFile.ts`: given log + audio + format, returns
      `{ file, converting, failed }`; original resolves synchronously, other
      formats convert in an effect (cancellable per format).

## View mode

- [x] 9. `views/LogView/components/FormatSelector.tsx`: compact Select bound
      to the current format; `ShareButton.tsx` refactored to take a ready
      `File` + `busy` and download from an object URL it creates itself.
- [x] 10. `LogView.tsx`: format state from settings, selector + share in the
      header, conversion notice; `LogViewRoute` keys the view per log.
- [x] 11. `RecorderView.tsx`: initial language from settings.

## Tests, docs

- [x] 12. Tests: `formats`, `settings`, `SettingsView`, `ShareButton`,
      `LogView`; update `App.test` mock if the header changes break it.
- [x] 13. `features/braindump/ideas.md`: move the format idea to an
      "Implemented" section pointing at PL-15.
- [x] 14. Verify: `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint`,
      `pnpm --filter web build`.
