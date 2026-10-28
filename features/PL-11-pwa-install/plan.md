# PL-11 — PWA install · execution plan

## Goal

The app installs as a standalone "Personal Log" PWA: correct title, dark chrome, iOS home-screen icon, maskable Android icon, offline shell. Build output verified; build, tests, lint pass.

Commands that must pass at the end (from the repo root):

```bash
pnpm build && pnpm test
pnpm -C apps/web lint
```

### Spec resolutions

- **No new code paths:** the SW, manifest generation and registration already work (verified in `dist/`); only static metadata changes.
- **Colors:** `#0a0a0a` everywhere (manifest already uses it for `theme_color`/`background_color`).

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Fix the app identity metadata in `index.html`

`apps/web/index.html`: change `<title>` from "web" to "Personal Log"; add the theme-color meta (`#0a0a0a`) and the apple-touch-icon link (`/apple-touch-icon-180x180.png`, both already in `public/`).

**Done when:** `pnpm -C apps/web typecheck` exits 0 (unchanged) and the three tags are present in `index.html`.

### 2. [x] Add the maskable icon to the manifest block

`apps/web/vite.config.ts`: add the existing `maskable-icon-512x512.png` to the `VitePWA` manifest `icons` array with `purpose: "maskable"`. Leave every other manifest field untouched.

**Done when:** `pnpm build` exits 0 and `dist/manifest.webmanifest` contains the maskable entry.

### 3. [x] Verify the install surface in the build output

Inspect `dist/` after the build: `index.html` carries the new title, theme-color meta, apple-touch-icon link and the injected manifest link + `registerSW.js` script; `sw.js` still contains the precache route; the manifest icons list includes maskable.

**Done when:** all of the above are present in `dist/`.

### 4. [x] Full verification

From the repo root:

```bash
pnpm build && pnpm test
pnpm -C apps/web lint
```

**Done when:** both commands exit 0.

### 5. [x] Browser checklist (user performs)

1. Serve the build (or dev server on localhost): the browser shows an install option (Chrome: install icon in the address bar; Safari iOS: Share → Add to Home Screen).
2. Install: the app opens standalone, titled "Personal Log", with the dark theme color in the OS chrome.
3. Home screen icon renders correctly (not a screenshot tile; safe cropping on Android).
4. With the app installed, go offline and open it: the shell loads (recordings list or recorder).

**Done when:** the checklist is included in the executor's report.

### 6. [x] Commit (HELD — do not run)

```bash
git add -A && git commit -m "PL-11: installable PWA metadata"
```

**Done when:** reported as held; marked `[x]` only after user approval and the commit is made.

### 7. [x] Mark remaining checkboxes

**Done when:** every checkbox in this file is `[x]`.