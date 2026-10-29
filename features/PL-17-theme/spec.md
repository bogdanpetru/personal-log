# PL-17 — Light/dark/system theme

## Goal

The app can be used in a light theme or a dark theme, or follow the OS. A
small switch in the bottom-right corner cycles the three modes, and the
settings screen offers the same choice as a segmented control.

## Tech stack

- Theme mode stored in the existing settings store (`localStorage`):
  `system | light | dark`, default `system`.
- Applied as the `dark` class on `<html>` (the Tailwind/shadcn convention
  already in `index.css`); an inline script in `index.html` applies it before
  first paint so there is no flash.
- `matchMedia("(prefers-color-scheme: dark)")` watched while in system mode.

## Scope

- `lib/theme.ts`: modes, labels, cycle order (light → dark → system), resolve
  against the OS, apply, watch OS changes.
- `useTheme` hook on top of `useSettings`, so every screen reads the same mode.
- Global `ThemeSwitch`: fixed bottom-right icon button (sun / moon / monitor
  for system) that cycles the mode; accessible label names the current mode
  and the next one.
- Settings page gains a **Theme** section: three-way segmented control
  (System / Light / Dark).
- Hardcoded `text-white` in the views becomes `text-foreground` so text stays
  readable in light mode; `color-scheme: light` on the light root.
- Tests: mode cycling/resolution/apply, settings persistence, the switch,
  and the settings control.

## References

- `apps/web/src/index.css`
- `apps/web/src/lib/settings.ts`
- `apps/web/src/views/SettingsView/SettingsView.tsx`
- `apps/web/src/App.tsx`
