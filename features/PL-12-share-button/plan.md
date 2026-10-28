# PL-12 — Share button · execution plan

## Goal

View mode has a header share button: OS share sheet with the audio file where supported, save-as-file download otherwise. Build, tests, lint pass.

Commands that must pass at the end (from the repo root):

```bash
pnpm build && pnpm test
pnpm -C apps/web lint
```

### Spec resolutions

- **File name:** `personal-log-<YYYY-MM-DD>_<HH-MM-DD>` from `createdAt` (local time), extension from the subtype of `log.audio.mimeType` (codes params stripped); `webm` as the fallback extension.
- **Cancellation vs failure:** `share()` rejecting with `AbortError` is a completed share (quietly done); any other rejection falls back to download.
- **Download reuses the live object URL** (`audioUrl`) — no second URL is created.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Expose the playback Blob from `usePersonalLog`

`apps/web/src/hooks/usePersonalLog.ts`: track the playback `Blob` in state next to `playbackSrc` — set where the URL is set (the `"recorded"` listener and `loadLogData`), cleared where the URL is cleared (`"discarded"`, entering `"recording"`, and the revoke-on-swap inside `loadLogData`). Expose it in the return + interface (e.g. `playbackAudio: Blob | null`).

**Done when:** `pnpm -C apps/web typecheck` exits 0.

### 2. [x] Create `ShareButton` in `views/LogView/components/`

`apps/web/src/views/LogView/components/ShareButton.tsx`: props `log`, `audio`, `audioUrl`. Derives the file name from `log.createdAt` + `log.audio.mimeType`. On click: build the `File`; if `navigator.canShare` accepts it, `navigator.share` (abort → done, other failure → download); otherwise download via a programmatic anchor on `audioUrl` with the derived name. Ghost icon button (lucide `Share2`), aria-label "Share recording".

**Done when:** typecheck exits 0.

### 3. [x] Wire it into `LogView` and `App`

`LogView` accepts the blob (e.g. `audio: Blob`) and renders `ShareButton` in the header, right side next to the language label. `App.tsx` passes `playbackAudio` through.

**Done when:** typecheck exits 0.

### 4. [x] Test `ShareButton`

`apps/web/src/views/LogView/components/ShareButton.test.tsx`: assert the accessible name; assert the download fallback when file sharing is unsupported (stub `URL.createObjectURL`/anchor click as needed). `App.test.tsx` mock gains the new `playbackAudio: null` field.

**Done when:** `pnpm -C apps/web exec vitest run src/views/LogView src/App.test.tsx` passes.

### 5. [x] Full verification

From the repo root:

```bash
pnpm build && pnpm test
pnpm -C apps/web lint
```

**Done when:** both commands exit 0.

### 6. [x] Browser checklist (user performs)

1. Open a recording in view mode: share icon visible in the header, right side.
2. Desktop Chrome/Safari: tapping it saves the audio file with the `personal-log-…` name.
3. Mobile: tapping it opens the OS share sheet with the audio file; send it to any app.
4. Cancelling the share sheet changes nothing (no error, no download).
5. The just-recorded playback view has the same share button.

**Done when:** the checklist is included in the executor's report.

### 7. [ ] Commit (HELD — do not run)

```bash
git add -A && git commit -m "PL-12: share button with download fallback"
```

**Done when:** reported as held; marked `[x]` only after user approval and the commit is made.

### 8. [ ] Mark remaining checkboxes

**Done when:** every checkbox in this file is `[x]`.