# PL-10 — Basic listing

## Goal

Opening the app now either starts a new recording (when none exist) or shows a scrollable list of stored recordings. Tapping a recording opens it in view mode, and every recording can be deleted after confirming in a modal.

## Tech stack

- **State/routing:** Local React state in `App.tsx` — three top-level modes (`list`, `record`, `view`) instead of a router.
- **Storage:** Existing `PersonalLog` core methods `getLogs`, `getLogData`, `deleteLog` via `OpfsStoragePlugin`.
- **UI primitives:** Existing shadcn `Button`, `Text`; add a shadcn `AlertDialog` for the delete confirmation.
- **Styling:** Tailwind v4; list uses white text, no borders, generous spacing, hover-only delete buttons that are always visible on mobile.

## Scope

The web app already records, stores and plays back logs. This item adds the list as the new landing screen.

- **Landing logic**
  - On first load, fetch the stored logs from the core.
  - If no logs exist, switch directly to record mode.
  - If logs exist, show the list.
  - Recording still completes via the existing recorder; when it finishes, switch to view mode for the just-recorded log.
- **List view**
  - Fixed top bar with a generic "New" button at the right and a title/heading on the left.
  - The list itself lives in a scroll container that grows to the bottom of the viewport and has bottom padding so the last row does not hug the screen edge.
  - Top bar is outside the scroll container and stays pinned.
  - Each row shows the log title in white text with no borders or card chrome.
  - Rows have decent vertical spacing between them.
  - Clicking a row opens that recording in view mode.
- **Delete action**
  - Each row has a delete button on the right.
  - The delete button is visible on hover on non-touch devices.
  - On mobile (touch), the delete button is always visible.
  - Tapping delete opens a confirmation alert dialog that asks whether the user is sure.
  - Confirming delete removes the log from storage and refreshes the list; if the list becomes empty, route back to record mode.
- **View mode**
  - Reuses the existing playback controls and transcript display.
  - Shows the selected recording's audio and transcript.
  - Provides a way to return to the list.
- **Record mode**
  - Reuses the existing recorder UI.
  - Provides a way to cancel/return to the list when recordings already exist.

## References

- Listing requirements from the conversation.
- `apps/web/README.md` — component layering and shadcn conventions.
