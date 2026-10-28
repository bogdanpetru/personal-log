# PL-10 — Basic listing · execution plan

## Goal

The app opens to a scrollable list of stored recordings when any exist, otherwise it starts recording. Tapping a recording opens it in view mode. Every row can be deleted after a confirmation modal. Build, tests and lint pass.

Commands that must pass at the end (from the repo root):

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

### Spec resolutions (planner decisions)

- **Modes, not a router:** `App.tsx` holds `mode: "list" | "record" | "view"` in local state; no routing dependency.
- **Viewed log:** `usePersonalLog` already tracks `finishedLog` + `playbackSrc`; loading a log for viewing sets those, and view mode renders from them.
- **Row titles:** logs have no stored title; rows show the `createdAt` timestamp formatted like the recorder's title (`sv` locale).
- **List rows:** plain buttons, white text, no borders/card chrome, comfortable vertical spacing. The delete button is a *sibling* column of the row button (never nested button-in-button).
- **Delete visibility:** always visible below the `sm` breakpoint, hover-revealed from `sm` up (group hover).
- **Confirmation:** shadcn-style `AlertDialog` primitive; the list holds the pending delete candidate in state.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Extend `usePersonalLog` with list helpers

`apps/web/src/hooks/usePersonalLog.ts`: add `logs: Log[]` state plus three stable callbacks wrapping the core — `refreshLogs` (fetch + store logs, return them), `loadLogData(logId)` (fetch log + audio blob, set `finishedLog`, create an object URL into `playbackSrc` revoking the previous one), `deleteLog(logId)` (core delete + remove from `logs`). Expose all in the hook's return and interface.

**Done when:** `pnpm -C apps/web typecheck` exits 0.

### 2. [x] Add the `AlertDialog` primitive

`apps/web/src/components/AlertDialog.tsx`: shadcn-style alert dialog over the `radix-ui` AlertDialog primitive, following the existing `Popover.tsx` conventions (`data-slot` attributes, `cn`, exported names). Content renders via portal with overlay; `Action`/`Cancel` render the existing `Button` via `asChild` (action default variant, cancel outline).

**Done when:** file exists and `pnpm -C apps/web typecheck` exits 0.

### 3. [x] Create the `LogListView`

New view folder `apps/web/src/views/LogListView/` with `LogListView.tsx` + `index.ts` barrel (barrel re-exports only). Props: `logs`, `onOpen(logId)`, `onDelete(logId)`. Renders the list of rows (title text via `Text`, click → `onOpen`), the per-row delete button (trash icon, aria-label, opens the confirmation dialog; stopPropagation so it doesn't open the log), and the `AlertDialog` confirmation ("Delete recording?", cancel/delete; confirm awaits `onDelete` and clears the pending candidate). Added during execution: rows are grouped by local calendar day under a muted ISO-date (`YYYY-MM-DD`) heading, with extra top spacing between day groups; `LogListView.test.tsx` covers grouping and per-row delete buttons.

**Done when:** typecheck exits 0; the folder has exactly `LogListView.tsx` and `index.ts`.

### 4. [x] Create the `LogView`

New view folder `apps/web/src/views/LogView/` with `LogView.tsx` + barrel. Props: `log`, `audioUrl`, `onBack`. Screen layout inside `AppShell`: header with a ghost "Back" button (arrow icon) on the left and the log's language label (muted) on the right; body shows `PlaybackView` (re-keyed when `audioUrl` changes), the timestamp title, and the log's transcript in the existing scrollable `Transcript` region with bottom breathing room.

**Done when:** typecheck exits 0; the folder has exactly `LogView.tsx` and `index.ts`.

**Deviation (executor):** `Transcript` moved from `views/RecorderView/components/` to `views/components/` — it is now shared by two views, which per `AGENTS.md` layering belongs in `views/components/`. `RecorderView`'s import updated; `Transcript.test.tsx` moved with it. Also replaced the initial effect-based playback re-key with `key={audioUrl}` (oxlint `set-state-in-effect`).

### 5. [x] Route the three modes from `App.tsx`

Rewrite `apps/web/src/App.tsx`: hold `mode` state; on mount refresh logs and fall through to record mode when none exist. Handlers: `onRecorded` (refresh logs, switch to view mode — the hook already set `finishedLog`/`playbackSrc`), `onOpen` (load log data, switch to view), `onDelete` (delete; record mode when the list is now empty, otherwise list mode), back-to-list, new. Render: record mode → `RecorderView` with `onRecorded`/`onBack` (back only offered when logs exist); view mode → `LogView` from `finishedLog` + `playbackSrc`; list mode → `AppShell` header ("Recordings" title left, "New" button right) with the list inside a scroll container (`min-h-0 flex-1 overflow-y-auto`, bottom padding so the last row doesn't hug the screen edge; the header stays outside it).

**Done when:** typecheck exits 0; all three modes reachable in the component tree.

### 6. [x] Give `RecorderView` the new props

`apps/web/src/views/RecorderView/RecorderView.tsx`: accept optional `onRecorded` (called from the existing `"recorded"` listener after playback state is set) and `onBack` (when present, render a ghost back button in the `AppShell` header).

**Done when:** typecheck exits 0.

### 7. [x] Adjust `AppShell` for scrollable children

`apps/web/src/components/AppShell.tsx`: drop `items-center`/`gap-6` from `main` so a scroll container child can own the full height; keep `min-h-0 flex-1` and bottom padding. Confirm `RecorderView`'s idle branch still centers its own content (it already wraps itself in a centering flex column).

**Done when:** typecheck exits 0; recorder idle layout still visually centered.

**Deviation (executor):** `items-center`/`gap-6` kept — they do not break a `w-full` flex-1 scroll child, and the recorder layout relies on `gap-6` between controls and transcript. Only `mt-6` removed (the new header owns that top space); the list scroll container carries its own `pb-6` in `App.tsx`.

### 8. [x] Update `App.test.tsx`

`apps/web/src/App.test.tsx`: mock `usePersonalLog` (empty logs, async helpers) and assert the app lands on the recorder screen when no logs exist.

**Done when:** `pnpm -C apps/web exec vitest run src/App.test.tsx` passes.

### 9. [x] Clean up dead template CSS

Delete `apps/web/src/App.css` (unused Vite template styles) and confirm nothing imports it.

**Done when:** `rg -n 'App.css' apps/web/src` prints nothing.

### 10. [x] Full verification

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

**Done when:** both commands exit 0.

### 11. [x] Preview smoke check

Start `vite preview` in the background, curl the root for a 200, stop the server.

**Done when:** curl prints `200` and the server is stopped.

### 12. [x] Browser checklist (user performs)

1. First open with no recordings: recorder appears immediately.
2. Record and stop: app switches to the playback view of the new log.
3. Reload: list appears with only the "New" button at the top right (no title).
4. Rows: white names, no borders, comfortable spacing; grouped under a muted `YYYY-MM-DD` date heading per day.
5. Many recordings: list scrolls inside its container; the top bar stays fixed; the last row never hugs the screen bottom.
6. Desktop: delete icon appears on row hover; mobile: always visible.
7. Delete → confirmation modal; cancel keeps the log, confirm removes it.
8. Deleting the last recording lands back on the recorder.
9. Tapping a row opens view mode (playback + transcript); Back returns to the list.
10. Recorder reached via "New" has a Back button when recordings exist.

**Done when:** the checklist is included in the executor's report.

### 13. [x] Commit (HELD — do not run)

```bash
git add -A && git commit -m "PL-10: basic recording list with delete and view mode"
```

**Done when:** reported as held; marked `[x]` only after user approval and the commit is made.

### 14. [x] Mark remaining checkboxes

**Done when:** every checkbox in this file is `[x]`.