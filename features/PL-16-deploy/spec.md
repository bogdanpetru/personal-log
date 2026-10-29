# PL-16 — GitHub Pages deploy

## Goal

The app is published on GitHub Pages from the `gh-pages` branch after every
push to `main`: the build works under the repository sub-path, deep links and
the PWA still work, and the site is installable from the Pages URL.

## Tech stack

- **Hosting:** GitHub Pages serving the `gh-pages` branch (root).
- **CI:** GitHub Actions — pnpm install, build, publish with
  `peaceiris/actions-gh-pages`.
- **Base path:** `BASE_PATH` env passed to Vite (`base`), derived from
  `GITHUB_REPOSITORY` in CI (`/<repo>/`, `/` for `<owner>.github.io`).

## Scope

- `vite.config.ts` honours `BASE_PATH` (default `/`); the router uses
  `import.meta.env.BASE_URL` as its basename.
- PWA stays installable under the sub-path: manifest scope/start URL and the
  service worker registration resolve against the base.
- SPA deep links on Pages: the build also writes `dist/404.html` from
  `index.html`, and `.nojekyll` ships in `dist`.
- `apps/web` build script produces the full Pages artifact (tsc, Vite, SPA
  fallback).
- `.github/workflows/deploy.yml` builds on push to `main` (and manual
  dispatch) and force-publishes `apps/web/dist` to `gh-pages`, with the base
  path computed from the repository name.
- `packageManager` pinned; root deployment notes in `DEPLOY.md`.

## References

- `apps/web/vite.config.ts`
- `apps/web/src/main.tsx`
- `apps/web/index.html`
- `apps/web/public/`
- `.gitignore`
