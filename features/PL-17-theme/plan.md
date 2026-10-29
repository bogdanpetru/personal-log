# PL-17 — Plan

- [x] 1. `lib/theme.ts`: `ThemeMode`, `THEME_MODES`, `THEME_LABELS`,
      `isThemeMode`, `nextThemeMode`, `resolveTheme`, `applyTheme`,
      `watchSystemTheme`.
- [x] 2. `lib/settings.ts`: `theme` field, default `system`, validation.
- [x] 3. `hooks/useTheme.ts`: mode + `setMode` + `cycle`, applies on change and
      follows OS changes.
- [x] 4. `index.html`: drop the hardcoded `class="dark"`, add the pre-paint
      theme script; `index.css`: `color-scheme: light` on `:root`.
- [x] 5. `views/components/ThemeSwitch.tsx` (fixed bottom-right, sun/moon/
      monitor) rendered from `App.tsx`.
- [x] 6. `views/SettingsView/components/ThemeSelector.tsx` (segmented control);
      Theme section in `SettingsView.tsx`.
- [x] 7. Replace `text-white` with `text-foreground` (Timer, PlaybackTime,
      LogListView, Transcript).
- [x] 8. `test-setup.ts`: `matchMedia` mock; tests for theme, settings,
      ThemeSwitch, SettingsView; update settings expectations.
- [x] 9. Verify: typecheck, tests, lint, base build.
