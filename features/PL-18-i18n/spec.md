# PL-18 — Internationalization

## Goal

The interface is translated: it follows the browser language by default and
can be switched in settings. Twenty major world languages plus Romanian are
supported, and each non-English translation is downloaded only when it is
selected.

## Tech stack

- Small in-app i18n on top of the settings store: typed message modules,
  `import.meta.glob` for one lazy chunk per locale, English bundled as the
  always-available fallback.
- Locale list (by total speakers): en, zh, hi, es, fr, ar, bn, pt, ru, ur,
  id, de, ja, sw, mr, te, tr, ta, vi, ko — plus **ro** (Romanian).
- Direction: `lang`/`dir` set on `<html>` (Arabic and Urdu are RTL); layout
  utilities switched to logical properties where they mattered.

## Scope

- Settings gains **locale**: browser language (primary subtag) by default,
  validated against the supported list, persisted.
- Settings page gains an **App language** section (searchable list, native
  names); the existing language setting is renamed **Transcription language**
  to tell the two apart.
- Every visible string moves to `t(key, params)` — buttons, aria-labels,
  dialogs, notices, settings copy — with `{param}` interpolation.
- Non-English locales are separate chunks fetched on selection; the UI shows
  English until the chunk arrives, with the English fallback per missing key.
- Tests: locale list/default detection, translation + interpolation fallback,
  lazy loading every locale (all keys present), settings persistence, and the
  settings control.

## References

- `apps/web/src/lib/settings.ts`
- `apps/web/src/views/SettingsView/SettingsView.tsx`
- `apps/web/src/views/components/LanguageSelector.tsx`
- `apps/web/src/views/LogListView/LogListView.tsx`
- `apps/web/src/views/RecorderView/RecorderView.tsx`
