# Deploying Personal Log

Personal Log is published as a static site on **GitHub Pages**, built from the
`gh-pages` branch by `.github/workflows/deploy.yml`.

## One-time setup

1. Push the repo to GitHub with the default branch `main`. Pushing to any
   other branch name means editing the `on.push.branches` trigger in
   `.github/workflows/deploy.yml`.
2. Settings → Pages → **Source: Deploy from a branch** → Branch
   **`gh-pages`** / **`/ (root)`**, then Save. The branch is created by the
   first workflow run.
3. Action permissions: Settings → Actions → General → Workflow permissions →
   **Read and write permissions** (the publish step pushes `gh-pages`).

The first push to `main` (or a manual **Deploy to GitHub Pages** run from the
Actions tab) builds the app and force-publishes `apps/web/dist` to `gh-pages`
as a single-commit branch.

## URL and base path

- Project site: `https://<owner>.github.io/<repo>/` — the workflow derives the
  Vite `base` from the repository name automatically.
- `<owner>.github.io` repository: base is `/`, also derived automatically.

To override the base (for example with a custom domain), create a repository
**variable** `BASE_PATH` (Settings → Secrets and variables → Actions →
Variables) with the value `/`. The workflow uses it verbatim.

## What the build produces

`pnpm build` runs `tsc -b`, `vite build` and a post-step that copies
`dist/index.html` to `dist/404.html`:

- `404.html` is the SPA fallback, so deep links such as
  `/<base>/records/<id>` load the app instead of a Pages 404.
- `dist/.nojekyll` is shipped so Pages serves the files untouched.
- `manifest.webmanifest`, `sw.js` and the icons make the site installable
  (Pages serves over HTTPS).
- The 32 MB FFmpeg wasm used for non-original download formats is emitted as
  a hashed asset, excluded from the service worker precache and fetched only
  on the first conversion.

## Local check

```bash
pnpm install
BASE_PATH=/personal-log/ pnpm build
pnpm --filter web preview   # open the printed URL, deep links need Pages
```

`pnpm dev` keeps base `/` for normal local development.

## PWA notes

- Install from the Pages URL once the workflow has published.
- The app shell, icons and fonts are precached; recordings stay on-device.
- MP3/WAV/M4A export works offline only after the FFmpeg wasm has been
  fetched once (it is runtime-cached, not precached).
