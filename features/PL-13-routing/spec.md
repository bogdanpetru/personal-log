# PL-13 — Routing

## Goal

Each screen in the web app has its own URL route, so the browser back/forward buttons work and a recording can be opened from a direct link.

## Tech stack

- **Router:** React Router v7 in library mode (`react-router` package, `BrowserRouter` + `Routes`/`Route`). Chosen because Vite has no built-in router and React Router is the lightest widely-used option.

## Scope

- Route `/records` shows the log list.
- Route `/record` starts a new recording.
- Route `/records/:logId` opens an existing recording in `LogView`.
- `/` redirects to `/records`.
- `App.tsx` replaces its local `mode` state with route configuration and route-driven navigation.
- Viewing a log loads it by route param (`useParams`) via `usePersonalLog().loadLogData(logId)`.
- Finishing a recording navigates to `/records/:logId` for the new log.
- Deleting the last log redirects to `/record`; otherwise back to `/records`.
- Back buttons navigate with the router (`useNavigate`, `Link`) instead of local state callbacks.
- Tests wrap renders in a memory router and assert the correct route/screen is shown.

## References

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/hooks/usePersonalLog.ts`
- `apps/web/src/views/LogListView/LogListView.tsx`
- `apps/web/src/views/LogView/LogView.tsx`
- `apps/web/src/views/RecorderView/RecorderView.tsx`
- `apps/web/README.md` (layering rules)
