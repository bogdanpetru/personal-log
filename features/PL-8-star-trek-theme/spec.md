# PL-8 — UI theme & recording title

## Goal

The web app has a distinct look — black background with yellow-orange text, no panel borders — and each new recording carries a bold, click-to-edit title that defaults to the current date and time (including seconds).

## Tech stack

- **Styling:** Tailwind v4 via `src/index.css` CSS variables (shadcn convention).
- **Components:** existing primitives (`Text`, `Button`, `Input`); standard lib/shadcn components first, custom composition only where the lib has nothing.

## Scope

- Theme palette in `src/index.css`: black background, yellow-orange foreground, dimmer amber for muted text; focus ring follows the text color.
- No bordered panels: the `AppShell` main panel has no light-blue (or any) border.
- Typography: `Text` sizes stay light-weight at the larger sizes decided earlier; a bold heading size exists for titles.
- Editable recording title:
  - Created whenever a recording is created, defaulting to current date + time in seconds.
  - Rendered as a bold heading (`Text`).
  - Hover shows a visual affordance that it is clickable/editable (cursor + dimming).
  - Clicking swaps the heading for an `Input` (shadcn primitive); Enter or blur commits, Escape cancels.
- Transcript text flows normally: left-aligned across the full panel width, not centered.
- Recording title stays yellow-orange (`--foreground`), bold, and left-aligned while the rest of the recording view stays centered.
- Transcript body text is white.
- Language selector: the selected value is not dimmed — it uses the foreground text color.

## References

- User requests in conversation (screenshot, theme iterations, title feature description).