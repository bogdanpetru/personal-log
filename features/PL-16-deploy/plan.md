# PL-16 — Plan

- [x] 1. `apps/web/vite.config.ts`: `base: process.env.BASE_PATH ?? "/"`.
- [x] 2. `apps/web/src/main.tsx`: `BrowserRouter basename` from
      `import.meta.env.BASE_URL` (trailing slash stripped, `/` fallback).
- [x] 3. `apps/web/scripts/spa-fallback.mjs` copying `dist/index.html` to
      `dist/404.html`; wire into the `build` script.
- [x] 4. `apps/web/public/.nojekyll` so Pages does not run Jekyll.
- [x] 5. Build with `BASE_PATH=/personal-log/`; verify `dist/index.html`
      asset URLs, manifest `start_url`/`scope`, sw registration, 404.html.
- [x] 6. `.github/workflows/deploy.yml`: pnpm + node setup, install, base-path
      step, build, `peaceiris/actions-gh-pages` force-orphan push to
      `gh-pages`.
- [x] 7. Root `package.json`: `packageManager` field.
- [x] 8. `DEPLOY.md`: enable Pages on `gh-pages`, repo sub-path/custom domain
      behaviour, local build preview.
- [x] 9. Verify: `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint`, local base
      build.
