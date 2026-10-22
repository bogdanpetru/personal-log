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

---

# Amendment 2 — header bar; readonly has no record button (2026-10-10)

Refinements to Amendment 1, same session:

- **Header bar** — a full-width bar at the top of the page carries the language
  selector on the left and, while recording, the stop button on the right. A light
  bottom border separates the header from the page. The stop button is a normal
  header item, no longer a fixed overlay. The controls sit **just below the
  header** — they are no longer vertically centered on the page; the transcript
  remains below the controls.
- **[readonly] shows no record button.** After stopping, the page shows only the
  playback row (play/pause, progress bar, position/duration) and the transcript.
  Consequence, known and accepted for now: readonly has no in-app way back to
  recording — a "new recording" affordance (Apple's "Done"-style exit) is a later
  item; a reload resets the app to the initial state.

---

# Amendment 3 — transcript panel; small button radius (2026-10-10)

- **Page locked to the viewport.** The page itself never scrolls: the header stays
  at the top, the controls flow directly beneath it, and the transcript takes all
  remaining space down to the page bottom (~20px content padding) and scrolls
  internally once the text exceeds it — all content is contained inside the screen.
- **Transcript styling** — left-aligned, pre-style wrapping (`whitespace-pre-wrap`)
  so inserted line breaks render as new lines.
- **Pause inserts a newline.** Clicking pause appends `\n` to the transcript (an
  empty transcript stays empty), so resume lands on a fresh line — one paragraph
  break per pause cycle. Session finals rejoined across a break do not get an
  extra separating space.
- **Auto-scroll.** While recording, arriving transcript text scrolls the panel to
  the bottom.
- **Normal buttons use a small ~3px radius** (`rounded-[3px]`): pause/resume,
  stop, playback play/pause, and the language-select trigger are no longer full
  pills. The record button remains a circle.

---

# Amendment 4 — language selector design; initial-state centering (2026-10-10)

- **Searchable selector.** The language selector is a combobox, not a plain
  `<select>`: a trigger button opening a popup with a search field and a listbox.
  Search is diacritic-insensitive and matches the native name, the short English
  name, and the BCP-47 code. Keyboard: arrows navigate, Enter commits, Escape/Tab
  close; the check mark marks the selection.
- **Names come from the browser, not hardcoding.** There is no browser API that
  enumerates languages (`Intl.supportedValuesOf` covers calendars/currencies/time
  zones only), so the *code list* stays curated — but every displayed name is
  generated with `Intl.DisplayNames`: the native label renders the primary subtag
  in its own locale (sentence-cased: "Deutsch", "Français", "Русский"), and the
  short English name feeds the search text.
- **Short names, one entry per language.** Region qualifiers are dropped —
  "German (Germany)" reads as duplicating the main name ("keep the first part,
  drop the secondary") — and variant codes that exist only to rename entries
  (`en-GB`, `pt-PT`, `zh-TW`) are not listed. One entry per primary language
  (~63 languages); the kept code keeps its region for the recognition engine
  (`en-US`, `pt-BR`, `zh-CN`).
- **Selection behavior** (from the original scope, still true): defaults to
  `navigator.language` with the `en-US` fallback, disabled while recording, and a
  new recording uses the language selected before it started.
- **Initial state centers the record button** vertically in the space below the
  header — and **only** that state centers. Recording and readonly are always
  top-aligned: the controls sit right below the header and the transcript flows
  beneath them, even while no transcript text exists yet (a silent recording is
  never centered). Playback is never vertically centered either.

## Conventions (accumulated during review)

- **Dark-only theme:** the app has no light mode; the Gruvbox dark palette is
  saved as tokens in `src/index.css` (full palette documented in its header
  comment).
- **Flat controls:** no drop shadows or rings (a no-blur ring was tried and
  removed on request).
- **Pointer cursor** on interactive controls; disabled ones keep not-allowed.
- **Hover feedback is a real color shift**, never opacity-only — e.g. the record
  button darkens `bg-record` → `bg-record-hover`, ordinary buttons use
  `hover:bg-muted/50`.
- **Normal buttons ~3px radius** (Amendment 3); the record button is a circle.

---

# Amendment 5 — transcript deduplication (2026-10-10)

**Problem.** Transcript text sometimes appeared duplicated, "especially when
stopping talking". Three mechanisms found: the recognition engine refines a result
on silence and re-finalizes it (the old code appended every final unconditionally);
the engine ends recognition on a pause in speech and restarts the same recognizer,
which re-delivers the last finalized segment; and the ephemeral in-progress text
lingered on screen next to the committed double of itself once its content became
final.

**Rule (the user's algorithm).** When newly recognized text begins with what
already ends the committed text, the overlap is trimmed instead of appended.
A full repeat of (a tail of) the committed text is always treated as re-delivery;
a partial overlap only trims once it is long enough that speech could not
legitimately be repeating a short phrase (default threshold 12 characters —
"the cat" → "the cat sat" stays a genuine repeat). Callers that know a
recognition restart just happened trim any overlap (threshold 1). A base ending
in a paragraph break (`\n`, from pause) joins directly, without a separating space.
The rule lives in one shared function (`appendTranscript` in `@personal-log/plugin-api`)
so the engine and the app apply the same semantics.

**Where it applies.**

- **Engine (native Web Speech plugin):** finalized results accumulate per result
  index — a longer restatement of the same index replaces the recorded segment
  (refinement), an identical or shorter one is dropped (re-delivery). When the
  recognizer restarts, the current run's segments fold into the committed session
  text through the shared rule (aggressive), and a totally unchanged session total
  is not re-emitted. `stop()` folds the same way.
- **App (`useTranscription`):** when a final arrives, the ephemeral partial is
  cleared at the same instant it is committed (it can never linger next to its
  double), and the new session text joins the pre-session transcript through the
  shared rule — also covering the pause/resume seam and any wholesale re-emission.

**Accepted trade-off.** Aggressive trimming at restart boundaries can drop a
legitimately repeated short phrase that immediately restates the committed tail;
the ≥12-character default protects the common app-level path, so only
engine-restart seams carry that risk.