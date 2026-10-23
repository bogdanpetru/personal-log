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
- Recording title sits below the pause button, directly above the transcript; it stays yellow-orange (`--foreground`), bold, and left-aligned while the rest of the recording view stays centered.
- Transcript body text and the timer are white.
- Language selector: the selected value is not dimmed — it uses the foreground text color.
- Stop button sits beside the pause button in the recording view, has a reddish background, and both pause/stop buttons are pill-rounded.
- Recording-view buttons use icons instead of text: play/pause icon on the pause/resume button, stop icon on the stop button, mic icon on the record button, play/pause icon on the playback button; the playback row matches the recording view's styling (pill-rounded, same colors).
- While recording, a rotating disc indicator next to the timer signals an active recording / passing time.
- Playback screen: large circle play/pause icons (`CirclePlay`/`CirclePause`) instead of the plain triangles.
- Language select: shown under the record button in the idle state; hidden during recording and playback (not in the header).
- View mode (playback of the just-finished log): shows the title (editable, as in recording), the log's language as a tag, and the log's transcription text below the player.
- Recording mode also shows the language pill after the title, above the transcript text; the timer/indicator row is without it.
- Visual hierarchy is token-based: a golden-ratio type scale (16px body → ×φ per step) and a Fibonacci spacing scale (8/13/21/34/55/144px) defined as CSS variables and consumed only through utility tokens — no raw pixel/rem values in components.
- Type scale: caption 13 (tags, small meta), body 16 (transcript, controls), lead 26 (recording title, bold), display 68 (timer). Body line-height φ.
- Control sizes: pill buttons 34px tall, record button 144px circle with a 55px mic, indicator disc 34px, panel max-width tokenized (40rem).

## References

- User requests in conversation (screenshot, theme iterations, title feature description).