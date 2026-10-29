# PL-18 — Plan

- [x] 1. `lib/i18n/locales.ts`: `Locale` union, `LOCALES` metadata (native,
      English name, dir), `isLocale`, `defaultLocale()` (browser language),
      `directionFor`.
- [x] 2. `lib/i18n/messages/en.ts`: the message map (source of truth) and the
      `Messages` type.
- [x] 3. Twenty locale modules (`ro`, `zh`, `hi`, `es`, `fr`, `ar`, `bn`,
      `pt`, `ru`, `ur`, `id`, `de`, `ja`, `sw`, `mr`, `te`, `tr`, `ta`,
      `vi`, `ko`) exporting the same keys.
- [x] 4. `lib/i18n/translate.ts` (`t` with `{param}` interpolation and English
      fallback) and `lib/i18n/i18n.ts` (state store, `loadLocale` via
      `import.meta.glob`, sets `<html lang/dir>`).
- [x] 5. `hooks/useTranslation.ts`.
- [x] 6. `lib/settings.ts`: `locale` field, default `defaultLocale()`,
      validation.
- [x] 7. `views/SettingsView/components/AppLanguageSelector.tsx`; App language
      section + rename the transcription language section.
- [x] 8. Replace visible strings with `t()` in App, LogListView, RecorderView,
      PlaybackView components, LogView/Route, ShareButton, FormatSelector,
      LanguageSelector, ThemeSwitch/ThemeSelector, RecordingTitle, buttons.
- [x] 9. RTL: `dir` handling, logical utilities (`end-4`, `text-end`, `ms/ps/pe`).
- [x] 10. Tests + update existing English assertions (section rename).
- [x] 11. Verify: typecheck, tests, lint, base build (one chunk per locale).
