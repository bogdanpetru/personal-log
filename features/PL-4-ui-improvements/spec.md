# PL-4 — UI improvements: record button, pause/resume, language selector

## Goal

Make the recorder look and behave like a real voice-recorder app: a large round record
button (red when idle, black square while recording), a small pause/resume button
beside it once recording has started, a language selector for the transcription
language (defaulting to the browser language), and no more "recording" indicator text.

## Tech stack

- **Styling:** existing stack — Tailwind classes on elements in `apps/web`; the record
  button is a plain `<button>` styled with Tailwind (fixed 150x150px, fully rounded).
  shadcn `Button` no longer used for the main button.
- **Language codes:** BCP-47 tags (e.g. `de-DE`), matching
  `TranscriptionOptions.language` in `@personal-log/plugin-api` — passed to
  `startLive()`. No plugin changes needed: the plugin already honors `language`.
- **Default language:** `navigator.language` (browser/system language), re-evaluated on
  each load; choice is not persisted.

## Scope

> **Superseded by Amendment 1** (end of this file): record/pause layout is replaced
> by the Apple Voice Recorder state machine. Kept here as the historical record.

- **Record button** — round, 150x150px:
  - Idle/stopped: solid red circle (record).
  - Recording: shows a black square (stop) centered in the button; clicking ends the
    recording.
  - Disabled when transcription is unsupported (as in PL-1).
- **Pause/Resume button** — small button next to the record button, visible only while
  recording has started; toggles between pause and resume. Pausing stops the live
  transcription (recognition session stops, accumulated transcript stays visible, no
  new text); resuming starts transcription again and keeps appending to the existing
  transcript. Pausing also must not lose the recording state (the record button keeps
  showing the black square; the pause button shows resume).
- **Language selector** — a dropdown above/beside the record button:
  - Default selection: browser language (`navigator.language`) when it is in the
    language list; otherwise the list's English (`en-US`) fallback.
  - The selected language is passed to the transcriber as `language`.
  - Changing the language takes effect on the next recording start (no live switch
    while recording).
  - Curated static list of common languages (final list and native-name labels
    defined in the plan).
- **Remove the recording indicator text** — the pulsing "recording" text is deleted;
  button state alone communicates recording.
- Transcript rendering (final + muted interim) below the controls stays as is.

Later work items add: plugin selection UI, persisting the chosen language, live
language switching mid-recording.

## References

- `apps/web/src/App.tsx`, `apps/web/src/hooks/useRecorder.ts`,
  `apps/web/src/hooks/useTranscription.ts` — the files this ticket changes
- `packages/plugin-api` — `TranscriptionOptions.language` the selector feeds

---

# Amendment 1 — Apple Voice Recorder flow (2026-10-10)

The original record-button/pause-button layout is superseded. The app is a state
machine that mimics the Apple Voice Recorder, with three states:

- **[initial]** — the record button is red (large round red button). Nothing else
  recording-related is visible.
- **[recording]** — the record button is removed entirely. In its place sits a
  pause/resume button (a normal pill button; pause freezes the timer and the
  transcript, resume continues both). A small timer is rendered that ticks up as it
  records (paused time excluded). At the top right of the screen there is a stop
  button. Clicking stop stops everything — recorder and transcription — and moves
  the app to the readonly state.
- **[readonly]** — a play/pause button plays the recorded audio. The timer shows the
  playback progress and a simple progress bar visualizes it. The transcript stays
  visible. The red record button returns (starting a new recording discards the
  old session and returns to [recording]).

Kept from the pre-amendment flow: the fail rule (stopping with an empty transcript
means nothing was recorded — the recording is treated as failed, nothing is kept,
and the app resets to the initial state) and pausing freezing the live transcript
while resuming appends to it.

Deferred: highlighting the transcript word at the playback point in time is listed
"if possible" — it needs a timed transcript source (word-level timestamps), which
the native Web Speech plugin does not provide. Revisit when a transcript source
with timing exists.