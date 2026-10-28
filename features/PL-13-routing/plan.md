# PL-13 — Routing plan

## Goal

`apps/web` uses React Router for navigation. `/records` shows the list, `/record` is the recorder, `/records/:logId` opens a stored recording, and `/` redirects to `/records`. Browser back/forward and direct links work; tests cover route-based rendering.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Install React Router

- **Files:** `apps/web/package.json`, lockfile.
- **What:** add the `react-router` dependency to `apps/web`.
- **Done when:** `pnpm install` completes and `react-router` resolves in `apps/web/node_modules`.

### 2. [x] Wire the router at the root

- **Files:** `apps/web/src/main.tsx`.
- **What:** wrap the app in `BrowserRouter` from `react-router`.
- **Done when:** `pnpm -C apps/web typecheck` passes.

### 3. [x] Convert `App.tsx` from mode state to routes

- **Files:** `apps/web/src/App.tsx`.
- **What:** replace the `AppMode` state and conditional rendering with `Routes`/`Route` from `react-router`. Define routes for `/` → redirect to `/records`, `/records` → list, `/record` → recorder, `/records/:logId` → view wrapper.
- **Conventions:** keep the same file; import the existing view barrel files; no new UI primitives.
- **Done when:** `pnpm -C apps/web typecheck` passes and the old `useState<AppMode>` code is gone.

### 4. [x] Create route-driven `LogView` loader

- **Files:** `apps/web/src/App.tsx` or a new small wrapper in `apps/web/src/views/LogView/`.
- **What:** a component that reads `logId` from `useParams`, calls `usePersonalLog().loadLogData(logId)`, and renders `LogView` once `finishedLog` and `playbackSrc`/`playbackAudio` are set. Handles the "not found" case by rendering a simple message.
- **Done when:** direct navigation to `/records/:logId` renders that log's playback and title in the test/browser.

### 5. [x] Navigate after recording and deleting

- **Files:** `apps/web/src/App.tsx`, `apps/web/src/views/RecorderView/RecorderView.tsx`, `apps/web/src/views/LogListView/LogListView.tsx`.
- **What:**
  - Remove the `onRecorded`/`onBack` props from `RecorderView`; instead `App.tsx` listens to the `core.on("recorded")` event and `useNavigate`s to `/records/:logId`.
  - In `LogListView`, remove the `onOpen` callback prop; each row becomes a `Link` to `/records/:logId`.
  - `LogListView` keeps the `onDelete` callback, but the delete handler in `App.tsx` now navigates to `/record` if the list becomes empty, otherwise `/records`.
- **Conventions:** `Link` and `useNavigate` from `react-router`; keep `Button` for the "New" header action (use `asChild` if needed or style a `Link` as a button).
- **Done when:** recording finishes → view route; clicking a list item → view route; deleting the last item → recorder route; deleting a non-last item → list route.

### 6. [x] Update back buttons to use the router

- **Files:** `apps/web/src/views/LogView/LogView.tsx`, `apps/web/src/views/RecorderView/RecorderView.tsx`.
- **What:** replace the `onBack` prop callback with `useNavigate(-1)` or a `Link` to `/records` where that is the natural destination. Remove the `onBack` prop entirely.
- **Done when:** back buttons in view and recorder navigate via the router and `typecheck` passes.

### 7. [x] Empty-list redirect

- **Files:** `apps/web/src/App.tsx`.
- **What:** when the list route renders and `logs.length === 0`, render a `Navigate` (or `useNavigate` effect) to `/record` so first-time users land on the recorder.
- **Done when:** loading `/records` with no logs redirects to `/record`.

### 8. [x] Update `App.test.tsx` for routes

- **Files:** `apps/web/src/App.test.tsx`.
- **What:** wrap test renders in `MemoryRouter` with initial entries (e.g. `/records`, `/record`) and assert the correct screen is shown. Add a test for `/records/:logId` opening a log.
- **Done when:** `pnpm -C apps/web test` passes.

### 9. [x] Full verification

- **Files:** whole app.
- **What:** run lint, typecheck, and tests.
- **Done when:** `pnpm -C apps/web lint && pnpm -C apps/web typecheck && pnpm -C apps/web test` all pass.

### 10. [ ] Browser smoke test (user checklist)

- **What:** run `pnpm -C apps/web dev`, then confirm:
  - `/` redirects to `/records`.
  - Empty storage lands on `/record`.
  - Recording finishes and URL becomes `/records/:id`.
  - Back button returns to `/records`.
  - Clicking a list item opens `/records/:id`.
  - Browser reload on `/records/:id` shows the same log.

### 11. [ ] Commit (held)

- **What:** commit the routing work.
- **Command:** `git add -A && git commit -m "PL-13: route each screen through react-router"`
- **Stop before running** and report the prepared commit; wait for user approval.
