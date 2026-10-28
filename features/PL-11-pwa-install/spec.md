# PL-11 — PWA install

## Goal

The web app installs as a standalone PWA: the browser's install prompt (or iOS Add to Home Screen) produces an app named "Personal Log" with the existing PWA icons, dark chrome, and an app shell that loads offline.

## Tech stack

- **PWA tooling:** the already-wired `vite-plugin-pwa` (`registerType: "autoUpdate"`, `generateSW`) in `apps/web/vite.config.ts` — no new dependencies.
- **Icons:** the existing set in `apps/web/public/` (`pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`).
- **Metadata:** static tags in `apps/web/index.html` plus the manifest block in `vite.config.ts`.

## Scope

The build already generates the service worker (precache + fetch handler), `manifest.webmanifest`, and injects SW registration — verified in `dist/`. This item completes what install prompts and home screens actually read.

- **App title:** `index.html` `<title>` is "Personal Log" (currently "web"), matching the manifest name.
- **Chrome color:** `<meta name="theme-color" content="#0a0a0a">` in `index.html`, matching the manifest `theme_color`.
- **iOS home screen:** `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">` in `index.html`.
- **Maskable icon:** the manifest icons include the existing `maskable-icon-512x512.png` with `purpose: "maskable"` so Android can crop safely.
- **Verified build output:** `dist/index.html` carries the title/meta/link; `dist/manifest.webmanifest` carries the maskable icon; `sw.js` + `registerSW.js` remain generated.

## References

- PWA install request from the conversation.
- `apps/web/vite.config.ts` and `apps/web/public/` — existing scaffolding from PL-0.