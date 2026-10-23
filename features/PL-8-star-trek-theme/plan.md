# PL-8 — UI theme & recording title

## Goal

Web app look: black background, yellow-orange text, no panel borders, plus a bold click-to-edit title for each recording defaulting to the current date + time in seconds. `pnpm test && pnpm build` pass.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Bluish theme palette in index.css (superseded by step 3's reversal)

Edit `apps/web/src/index.css` `:root` variables: background #06142a, foreground #ffffff, card/popover #0b1e3a, primary #5bbcff, secondary/muted/accent #0f2748, muted-foreground #9bbcd6, border/input #4ea8de, ring #5bbcff, sidebar variants, radius 0.5rem.

Done when: `grep -- '--background:' apps/web/src/index.css` shows a value.

### 2. [x] Light larger Text sizes

Edit `apps/web/src/components/Text.tsx` sizes to drop bold and increase size: xs "text-sm font-light", sm "text-base font-light", base "text-lg font-light", display "text-5xl font-light".

Done when: `grep 'text-5xl font-light' apps/web/src/components/Text.tsx`.

### 3. [x] Drop panel border, black background, yellow-orange text

- Edit `apps/web/src/components/AppShell.tsx`: remove `rounded-lg border border-border` from main (keep `mx-auto w-full max-w-[640px] mt-6 px-6 py-8`).
- Edit `apps/web/src/index.css` `:root`: `--background: #000000`, `--foreground: #ffaa33`, `--muted-foreground: #c48a3c`, `--ring: #ffaa33`.

Done when: `grep -c 'border-border' apps/web/src/components/AppShell.tsx` is 0 and `grep -- '--background: #000000' apps/web/src/index.css` matches.

### 4. [x] Bold heading size in Text

Edit `apps/web/src/components/Text.tsx`: add `title: "text-2xl font-bold"` to the sizes map.

Done when: `grep 'text-2xl font-bold' apps/web/src/components/Text.tsx`.

### 5. [x] RecordingTitle component

Create `apps/web/src/components/RecordingTitle.tsx`: pure presentational, composes the existing `Text` and `Input` lib primitives (shadcn-based; no bespoke raw elements). Display mode = `Text` with `size="title"`, `cursor-pointer hover:opacity-70`; click switches to edit mode. Edit mode = `Input` rendered with autofocus; Enter or blur commits via `onCommit(newTitle)`, Escape cancels back to display.

Done when: `test -f apps/web/src/components/RecordingTitle.tsx`.

### 6. [x] Wire title into RecorderView

Edit `apps/web/src/views/RecorderView.tsx`: `title` state; in `start()` generate the default title from `new Date()` as date + time including seconds (e.g. `2026-01-15 22:58:03`); render `<RecordingTitle title={title} onCommit={setTitle} />` above the timer while `recording` is true.

Done when: `grep 'RecordingTitle' apps/web/src/views/RecorderView.tsx`.

### 7. [x] Verify build and tests

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 8. [x] Transcript flows left-aligned, full panel width

Edit `apps/web/src/components/Transcript.tsx`: drop `max-w-prose` from the scroll container (keep `w-full text-left`).

Done when: `grep -c 'max-w-prose' apps/web/src/components/Transcript.tsx` is 0.

### 9. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 10. [x] Title left-aligned yellow, transcript white, selector value bright

- Edit `apps/web/src/components/RecordingTitle.tsx`: add `self-start` to the heading.
- Edit `apps/web/src/components/Transcript.tsx`: add `text-white` to the content Text.
- Edit `apps/web/src/components/LanguageTrigger.tsx`: add `text-foreground` to the trigger's label Text span.

Done when: `grep 'self-start' apps/web/src/components/RecordingTitle.tsx`, `grep 'text-white' apps/web/src/components/Transcript.tsx`, `grep 'text-foreground' apps/web/src/components/LanguageTrigger.tsx` all match.

### 11. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 12. [x] Title under the pause button, above the transcript

Edit `apps/web/src/views/RecorderView.tsx`: recording branch order is `Timer`, `PauseResumeButton`, `RecordingTitle` (left-aligned via kept `self-start` on a `w-full` column).

Done when: `grep -B1 'RecordingTitle' apps/web/src/views/RecorderView.tsx | grep PauseResumeButton` matches.

### 13. [x] Stop button beside pause, reddish background

- Edit `apps/web/src/components/StopButton.tsx`: reddish background (`bg-record hover:bg-record-hover`).
- Edit `apps/web/src/views/RecorderView.tsx`: remove `StopButton` from the header; in the recording branch render pause + stop in a shared row (`flex items-center gap-3`), above the title.

Done when: `grep 'bg-record' apps/web/src/components/StopButton.tsx` matches and the header fragment no longer contains StopButton.

### 14. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 15. [x] Pill-rounded pause/stop buttons

Edit `apps/web/src/components/PauseResumeButton.tsx` and `apps/web/src/components/StopButton.tsx`: change `rounded-[3px]` to `rounded-full`.

Done when: `grep -c 'rounded-full' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx` shows 1 each.

### 16. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 17. [x] White timer text

Edit `apps/web/src/components/Timer.tsx`: add `text-white` to the timer Text.

Done when: `grep 'text-white' apps/web/src/components/Timer.tsx` matches.

### 18. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 19. [x] Icon buttons

- Edit `apps/web/src/components/PauseResumeButton.tsx`: render lucide `Play` (paused) / `Pause` (recording) icons instead of text, keep the aria-labels.
- Edit `apps/web/src/components/StopButton.tsx`: render lucide `Square` instead of "Stop", keep the aria-label.
- Edit `apps/web/src/components/RecordButton.tsx`: render a lucide `Mic` inside the circle.

Done when: `grep -c 'lucide-react' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx apps/web/src/components/RecordButton.tsx` shows 1 each.

### 20. [x] Rotating recording indicator

Create `apps/web/src/components/RecordingIndicator.tsx`: pure presentational lucide `Disc3`, red, slow CSS spin. Edit `apps/web/src/views/RecorderView.tsx`: wrap timer + indicator in one flex row.

Done when: `grep 'animate' apps/web/src/components/RecordingIndicator.tsx` matches and `grep 'RecordingIndicator' apps/web/src/views/RecorderView.tsx` matches.

### 21. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 22. [x] Playback button uses icons, matches recording styling

Edit `apps/web/src/views/PlaybackView.tsx`: play/pause lucide icons replace the text; button becomes pill-rounded like the others.

Done when: `grep 'lucide-react' apps/web/src/views/PlaybackView.tsx` and `grep 'rounded-full' apps/web/src/views/PlaybackView.tsx` match.

### 23. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 24. [x] Bigger, nicer playback icons

Edit `apps/web/src/views/PlaybackView.tsx`: use `CirclePlay`/`CirclePause` at `size-7`.

Done when: `grep 'CirclePlay' apps/web/src/views/PlaybackView.tsx` and `grep 'size-7' apps/web/src/views/PlaybackView.tsx` match.

### 25. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 26. [x] Language select under the record button, hidden while recording/playing

- Edit `apps/web/src/components/AppShell.tsx`: `header` becomes optional (`header?: ReactNode`, render only when provided).
- Edit `apps/web/src/views/RecorderView.tsx`: drop `header`; idle branch wraps RecordButton + LanguageSelect in one centered column.

Done when: `grep -c 'header=' apps/web/src/views/RecorderView.tsx` is 0 and the idle branch contains `LanguageSelect`.

### 27. [x] View mode: language tag + transcript text

- Edit `apps/web/src/hooks/usePersonalLog.ts`: capture the `recorded` event's `Log` (`finishedLog` state), clear it on `discarded` and on starting a new recording; return it.
- Create `apps/web/src/components/LanguageTag.tsx`: pure pill tag (Text-based).
- Edit `apps/web/src/views/RecorderView.tsx`: in the playback branch render (in order) `PlaybackView`, `RecordingTitle` (kept editable), `LanguageTag` (label from the finished log's first transcription, fallback to the current language); Transcript uses the finished log's transcription text in view mode, live state text while recording.

Done when: `grep 'finishedLog' apps/web/src/hooks/usePersonalLog.ts` and `grep 'LanguageTag' apps/web/src/views/RecorderView.tsx` match.

### 28. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 29. [x] Language tag while recording

Edit `apps/web/src/views/RecorderView.tsx`: recording branch's indicator/timer row also shows `LanguageTag` (current `language` state).

Done when: `grep -A3 'RecordingIndicator' apps/web/src/views/RecorderView.tsx | grep LanguageTag` matches.

### 30. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 31. [x] Pill after the title in recording mode

Edit `apps/web/src/views/RecorderView.tsx`: recording branch — move `LanguageTag` out of the indicator/timer row to directly after `RecordingTitle`.

Done when: `grep -B2 'LanguageTag' apps/web/src/views/RecorderView.tsx | grep RecordingTitle` matches in the recording branch and the timer row no longer contains it.

### 32. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 33. [x] Golden/Fibonacci tokens in index.css

Edit `apps/web/src/index.css`: drop the stale Gruvbox comment block; add to `:root` the type scale (`--type-caption: 0.8125rem`, `--type-body: 1rem`, `--type-lead: 1.625rem`, `--type-heading: 2.625rem`, `--type-display: 4.25rem`); add to the existing `@theme inline` block: text tokens (`--text-caption/--text-body/--text-lead/--text-display` with line-heights — body `1.618`), spacing tokens `--spacing-s1..s6` (8/13/21/34/55/144px) and `--container-panel: 40rem`.

Done when: `grep -- '--type-body' apps/web/src/index.css` and `grep -- '--spacing-s3' apps/web/src/index.css` both match.

### 34. [x] Text sizes consume the tokens

Edit `apps/web/src/components/Text.tsx`: sizes map becomes `xs/sm -> text-caption`, `base -> text-body`, `title -> text-lead font-bold`, `display -> text-display`.

Done when: `grep 'text-caption' apps/web/src/components/Text.tsx` matches.

### 35. [x] Spacing consumes the tokens

- Edit `apps/web/src/components/AppShell.tsx`: root `p-s3`; main `mt-s3 px-s4 py-s5 gap-s4 max-w-panel`.
- Edit `apps/web/src/views/RecorderView.tsx`: recording column `gap-s3`, button row `gap-s2`, idle column `gap-s4`.

Done when: `grep -c 'gap-3\|gap-4\|gap-6\|px-6\|py-8\|p-4\|max-w-\[640px\]' apps/web/src/components/AppShell.tsx apps/web/src/views/RecorderView.tsx` shows 0 matches.

### 36. [x] Controls consume the tokens

- `PauseResumeButton`, `StopButton`, `PlaybackView` button: `h-s4 px-s3` pills; playback icons `size-s3`.
- ` RecordingIndicator`: `size-s4`.
- `RecordButton`: `size-s6` circle, Mic `size-s5`.
- `LanguageTag`: `px-s2 py-s1`.
- `LanguageTrigger`: `h-s4 px-s3 rounded-md`; `LanguageOptions` rows `px-s1 py-s1`.

Done when: `grep -rn 'h-10\|px-4\|py-2\|size-6\|size-7\|size-10\|h-\[120px\] w-\[120px\]' apps/web/src/components/` shows no hits in the touched files.

### 37. [x] Verify build and tests (final)

Run: `cd apps/web && pnpm test && pnpm build`

Done when: exit code 0.

### 38. [ ] Commit (held)

Run only after user approval: `git add -A && git commit -m "PL-8: UI theme + recording title"`
Then mark checkboxes.

Done when: user approves commit.