# PL-9 — UI revamp · execution plan

## Goal

The recorder UI uses shadcn defaults: a live sound waveform above a large centered 5rem white timer, shadcn buttons with no hand-written styling, a small shadcn badge inline with the title, shadcn progress in playback, and a transcript that fills the remaining viewport with bottom breathing room and follows new text. The idle state keeps its centered record button and language selector. The app uses the shadcn neutral dark theme and no spinning indicator.

Commands that must pass at the end (from the repo root):

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

plus the preview-server check in step 22 and the browser checklist in step 23.

> Iteration 2 note: steps 13–23 supersede the indicator, button-radius and yellow-theme decisions from steps 3–5. The spinning indicator is removed, buttons use shadcn defaults, and the theme is shadcn neutral dark.

### Spec resolutions (planner decisions; executor stops and reports if reality contradicts one)

- **Timer is a `div`:** implemented as `<Text as="div" role="timer" …>` — the visible text still goes through the `Text` primitive (repo UI rule) while the element is a `div`, not a paragraph. The existing `role="timer"` provides the accessible semantics.
- **5rem timer text:** the `display` size token in `Text.tsx` becomes `text-[5rem] leading-none font-light`. Only `Timer` consumes `size="display"` today (verified 2026-10-28); `leading-none` keeps the block as compact as the old `text-5xl`.
- **Indicator offsets:** the spec pins the disc to the timer's bottom-right but not the exact offsets; the plan uses a `relative` timer wrapper in `RecorderView` with the disc at `absolute -bottom-2 -right-10` (48px disc tucked into the corner of the 5rem timer). Positioning lives in the view; `RecordingIndicator` stays a pure icon.
- **Title/tag row:** composed once in `RecorderView` as a local `titleRow` element shared by the recording and playback branches — guaranteed same arrangement, no new file (`views/components/` only when needed).
- **"Transcript region always present":** `Transcript` no longer returns `null` when empty; `RecorderView` renders it only in the recording and playback states, so the idle state keeps its exact centered layout (the spec scopes "always present" to recording/playback and says idle keeps its layout).
- **"Down to the bottom of the viewport":** the app shell loses its bottom padding (`p-4` → `px-4 pt-4`) and `main` its bottom padding (`py-8` → `pt-8`); otherwise the transcript region would stop above the viewport bottom.
- **Language tag stays a rounded pill** — the spec's 2–3px radius applies to control buttons only.

### Toolchain notes

- No new dependencies, no shadcn CLI adds, no tsconfig changes.
- Tailwind v4 is already wired (`@tailwindcss/vite` + `tailwindcss()` in `apps/web/vite.config.ts`) — nothing to install.
- Vitest 5 is already configured (jsdom, `globals: true`, `src/test-setup.ts`); `--passWithNoTests` stays in the `test` script.
- If a command fails for toolchain-drift reasons (renamed flags, changed defaults), follow the ground rules: stop and report.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Make the `display` text size 5rem

Guard first (must show only `Timer.tsx`; if anything else also consumes `size="display"`, stop and report):

```bash
rg -n 'size="display"' apps/web/src
```

In `apps/web/src/components/Text.tsx`, replace:

```tsx
  display: "text-5xl font-light",
```

with:

```tsx
  display: "text-[5rem] leading-none font-light",
```

**Done when:** the guard output listed only `apps/web/src/components/Timer.tsx`, and `rg -n 'text-\[5rem\]' apps/web/src/components/Text.tsx` matches line 9.

### 2. [x] Timer renders as a div (role kept) + test

Replace the whole file `apps/web/src/components/Timer.tsx` with:

```tsx
import { Text } from "@/components/Text";

interface TimerProps {
  seconds: number;
}

function format(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function Timer({ seconds }: TimerProps) {
  return (
    <Text
      as="div"
      role="timer"
      size="display"
      className="tabular-nums text-white"
    >
      {format(seconds)}
    </Text>
  );
}
```

Append this test to `apps/web/src/components/Timer.test.tsx` (keep the two existing tests):

```tsx
test("renders as a div", () => {
  render(<Timer seconds={65} />);
  expect(screen.getByRole("timer").tagName).toBe("DIV");
});
```

Run:

```bash
pnpm -C apps/web exec vitest run src/components/Timer.test.tsx
```

**Done when:** the vitest run reports 3 passing tests.

### 3. [x] Double the recording disc to size-12

Replace the whole file `apps/web/src/components/RecordingIndicator.tsx` with:

```tsx
import { Disc3 } from "lucide-react";

export function RecordingIndicator() {
  return (
    <Disc3
      aria-hidden
      className="size-12 animate-[spin_2.4s_linear_infinite] text-record"
    />
  );
}
```

**Done when:** `rg -n 'size-12' apps/web/src/components/RecordingIndicator.tsx` matches and `rg -n 'size-6' apps/web/src/components/RecordingIndicator.tsx` prints nothing.

### 4. [x] Move the disc into the timer's bottom-right (RecorderView)

In `apps/web/src/views/RecorderView.tsx`, replace:

```tsx
      {recording ? (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <RecordingIndicator />
            <Timer seconds={state.seconds} />
          </div>
```

with:

```tsx
      {recording ? (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="relative">
            <Timer seconds={state.seconds} />
            <div className="absolute -bottom-2 -right-10">
              <RecordingIndicator />
            </div>
          </div>
```

Run:

```bash
pnpm -C apps/web typecheck
```

**Done when:** typecheck exits 0 and `rg -n '"relative"' apps/web/src/views/RecorderView.tsx` matches exactly 1 line.

### 5. [x] Square off the control buttons (rounded-[3px])

Replace `rounded-full` with `rounded-[3px]` in each file's Button `className` so the strings become exactly:

- `apps/web/src/components/PauseResumeButton.tsx` → `"h-10 cursor-pointer rounded-[3px] border border-border bg-transparent px-4 text-foreground transition-colors hover:bg-muted"`
- `apps/web/src/components/StopButton.tsx` → `"h-10 cursor-pointer rounded-[3px] border border-transparent bg-record px-4 text-white transition-colors hover:bg-record-hover"`
- `apps/web/src/components/RecordButton.tsx` → `"flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-[3px] bg-record transition-colors hover:bg-record-hover disabled:cursor-not-allowed disabled:opacity-40"`
- `apps/web/src/views/PlaybackView.tsx` → `"h-10 cursor-pointer rounded-[3px] border border-border bg-transparent px-4 text-foreground transition-colors hover:bg-muted"`

Sizes, colors, icons and aria labels stay unchanged. The language tag pill and the playback progress bar keep `rounded-full` — do not touch `LanguageTag.tsx` or `PlaybackProgressBar.tsx`.

**Done when:** `rg -n 'rounded-full' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx apps/web/src/components/RecordButton.tsx apps/web/src/views/PlaybackView.tsx` prints nothing, and `rg -n 'rounded-\[3px\]' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx apps/web/src/components/RecordButton.tsx apps/web/src/views/PlaybackView.tsx` matches all 4 files (the language trigger already uses `rounded-[3px]` and is intentionally left unchanged).

### 6. [x] Title goes small and light

In `apps/web/src/components/RecordingTitle.tsx`, replace:

```tsx
    <Text
      as="h1"
      size="title"
      onClick={() => setEditing(true)}
      className="cursor-pointer self-start transition-opacity hover:opacity-70"
    >
```

with:

```tsx
    <Text
      as="h1"
      size="sm"
      onClick={() => setEditing(true)}
      className="cursor-pointer transition-opacity hover:opacity-70"
    >
```

`size="sm"` is `text-base font-light` — small, not bold. Dropping `self-start`: the row wrapper added in step 7 owns alignment from now on.

**Done when:** `rg -n 'size="sm"' apps/web/src/components/RecordingTitle.tsx` matches and `rg -n 'self-start|size="title"' apps/web/src/components/RecordingTitle.tsx` prints nothing.

### 7. [x] Inline title/tag row in both branches + gate the transcript

Four edits in `apps/web/src/views/RecorderView.tsx`:

7a. Replace:

```tsx
  const transcript = recording
    ? state.transcript
    : playingBack
      ? (finishedLog?.transcriptions[0]?.text ?? "")
      : "";

  return (
```

with:

```tsx
  const transcript = recording
    ? state.transcript
    : playingBack
      ? (finishedLog?.transcriptions[0]?.text ?? "")
      : "";
  const titleRow = (
    <div className="flex items-center gap-3 self-start">
      <RecordingTitle title={title} onCommit={setTitle} />
      <LanguageTag label={viewLanguageLabel} />
    </div>
  );

  return (
```

7b. Replace:

```tsx
          <RecordingTitle title={title} onCommit={setTitle} />
          <LanguageTag label={viewLanguageLabel} />
        </div>
      ) : playingBack ? (
```

with:

```tsx
          {titleRow}
        </div>
      ) : playingBack ? (
```

7c. Replace:

```tsx
        <>
          <PlaybackView key={playbackSrc} src={playbackSrc} />
          <RecordingTitle title={title} onCommit={setTitle} />
          <LanguageTag label={viewLanguageLabel} />
        </>
```

with:

```tsx
        <>
          <PlaybackView key={playbackSrc} src={playbackSrc} />
          {titleRow}
        </>
```

7d. Replace:

```tsx
      <Transcript
        autoScroll={recording}
        transcript={transcript}
        partial={recording ? state.partial : ""}
      />
    </AppShell>
```

with:

```tsx
      {recording || playingBack ? (
        <Transcript
          autoScroll={recording}
          transcript={transcript}
          partial={recording ? state.partial : ""}
        />
      ) : null}
    </AppShell>
```

Run:

```bash
pnpm -C apps/web typecheck
```

**Done when:** typecheck exits 0; `rg -n 'titleRow' apps/web/src/views/RecorderView.tsx` matches exactly 3 lines (definition + two uses); `rg -n '<RecordingTitle' apps/web/src/views/RecorderView.tsx` matches exactly 1 line (inside `titleRow`).

### 8. [x] Transcript region is always rendered + test

Replace the whole file `apps/web/src/components/Transcript.tsx` with:

```tsx
import { useEffect, useRef } from "react";
import { Text } from "@/components/Text";

interface TranscriptProps {
  transcript: string;
  partial: string;
  autoScroll?: boolean;
}

export function Transcript({
  transcript,
  partial,
  autoScroll = false,
}: TranscriptProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const panel = panelRef.current;
    if (panel !== null) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [autoScroll, partial, transcript]);

  return (
    <div
      ref={panelRef}
      className="min-h-0 w-full flex-1 overflow-y-auto text-left"
    >
      <Text className="whitespace-pre-wrap text-white">
        {transcript}
        {partial !== "" && (
          <Text as="span" muted>
            {" "}
            {partial}
          </Text>
        )}
      </Text>
    </div>
  );
}
```

In `apps/web/src/components/Transcript.test.tsx`, replace the first test:

```tsx
test("renders nothing while there is no text", () => {
  const { container } = render(<Transcript transcript="" partial="" />);
  expect(container).toBeEmptyDOMElement();
});
```

with:

```tsx
test("renders an empty scrollable region while there is no text", () => {
  const { container } = render(<Transcript transcript="" partial="" />);
  const region = container.querySelector("div");
  expect(region).toHaveClass("flex-1", "overflow-y-auto");
});
```

Keep the other two tests unchanged.

Run:

```bash
pnpm -C apps/web exec vitest run src/components/Transcript.test.tsx
```

**Done when:** the vitest run reports 3 passing tests.

### 9. [x] Bound the app shell to the viewport (h-dvh)

Replace the whole file `apps/web/src/components/AppShell.tsx` with:

```tsx
import type { ReactNode } from "react";

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col px-4 pt-4">
      {header !== undefined && (
        <header className="flex w-full items-center justify-between px-2 py-2">
          {header}
        </header>
      )}
      <main className="mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col items-center gap-6 mt-6 px-6 pt-8">
        {children}
      </main>
    </div>
  );
}
```

Run:

```bash
pnpm -C apps/web typecheck
```

**Done when:** typecheck exits 0; `rg -n 'h-dvh' apps/web/src/components/AppShell.tsx` matches; `rg -n 'min-h-screen|py-8' apps/web/src/components/AppShell.tsx` prints nothing.

### 10. [x] Full verification

From the repo root:

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

**Done when:** both commands exit 0.

### 11. [x] Preview server smoke check

From the repo root:

```bash
pnpm -C apps/web exec vite preview --port 4173 >/tmp/pl9-preview.log 2>&1 &
sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/
lsof -ti :4173 | xargs kill
```

**Done when:** curl prints `200` and the server is stopped afterwards.

### 12. [x] Browser checklist (user performs)

Put this checklist in the report for the orchestrator to hand to the user.

1. Idle: big square-cornered record button with mic icon centered, language selector under it, no transcript region.
2. Recording: large white 5rem timer centered, digits not jiggling as seconds tick; disc spins tucked into the timer's bottom-right without shifting the timer off-center.
3. Pause/stop buttons have crisp ~3px corners and still work (pause/resume toggles icon and aria label).
4. Title: small, light, not bold, left-aligned, language pill immediately to its right; click-to-edit works (Enter commits, Escape cancels).
5. Transcript: fills from below the controls to the bottom of the viewport; new finals/partials appear and the region follows by scrolling to the bottom; long text scrolls inside the region and the page never grows.
6. After stop: playback view shows the play/pause button with 3px corners, progress bar and time, the same inline title/tag row, and the same scrollable transcript region.

**Done when:** the checklist text is included in the executor's report.

### 13. [x] Restore the shadcn neutral dark theme

- Add `class="dark"` to `<html>` in `apps/web/index.html`.
- In `apps/web/src/index.css`, replace the custom `:root` palette with the default shadcn neutral light `:root` and `.dark` values; set `--radius: 0.625rem`; remove `--record` and `--record-hover`.
- Remove `--color-record` and `--color-record-hover` from the `@theme inline` block.

Done when: `rg -n 'ffaa33|0b1e3a|ff5a4d|--record|5bbcff' apps/web/src/index.css` prints nothing, `rg -n 'class="dark"' apps/web/index.html` matches, and `rg -n '\.dark' apps/web/src/index.css` matches.

### 14. [x] Add shadcn Badge and Progress primitives

Create `apps/web/src/components/Badge.tsx` and `apps/web/src/components/Progress.tsx` from the `radix-nova` shadcn registry source (PascalCase filenames, existing `cn` import).

Done when: `test -f apps/web/src/components/Badge.tsx && test -f apps/web/src/components/Progress.tsx`.

### 15. [x] Use shadcn buttons, Badge and Progress

- `PauseResumeButton`: `Button variant="outline" size="icon"`, no custom className.
- `StopButton`: `Button variant="destructive" size="icon"`, no custom className.
- `PlaybackView`: `Button variant="outline" size="icon"`, no custom className.
- `RecordButton`: `Button variant="default" size="icon" className="size-[120px]"`, mic icon `size-10`.
- Replace `LanguageTag` usages with `<Badge variant="secondary">`.
- Replace `PlaybackProgressBar` with `<Progress value={percent} className="w-40" />`.
- Delete `LanguageTag.tsx` and `PlaybackProgressBar.tsx`.

Done when: `rg -n 'rounded-full|bg-record|rounded-\[3px\]|--record' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx apps/web/src/components/RecordButton.tsx apps/web/src/views/PlaybackView.tsx` prints nothing, and `rg -n 'Badge|Progress' apps/web/src/views/RecorderView.tsx apps/web/src/views/PlaybackView.tsx` matches.

### 16. [x] Replace the custom language selector with the shadcn Combobox

- Add `cmdk`: `pnpm -C apps/web add cmdk`.
- Create `apps/web/src/components/Popover.tsx` from the shadcn registry source.
- Create `apps/web/src/components/Command.tsx` from the shadcn registry source, using `Input` styling conventions and lucide icons.
- Rewrite `LanguageSelect.tsx` with `Popover` + `Command` + `CommandInput` + `CommandList` + `CommandItem`; keep search, keyboard selection and disabled state.
- Update `LanguageSelect.test.tsx` for the new combobox.
- Delete `LanguageOptions.tsx`, `LanguageOptionRow.tsx`, `LanguageSearchField.tsx`, `LanguageTrigger.tsx`, `List.tsx`, `ListItem.tsx`.

Done when: `rg -n 'LanguageOptions|LanguageOptionRow|LanguageSearchField|LanguageTrigger|@/components/List|@/components/ListItem' apps/web/src` prints nothing, `rg -n 'Command|Popover' apps/web/src/components/LanguageSelect.tsx` matches, and `pnpm -C apps/web exec vitest run src/components/LanguageSelect.test.tsx` passes.

### 17. [x] Remove the spinning recording indicator

Delete `apps/web/src/components/RecordingIndicator.tsx` and remove its import and usage from `RecorderView`.

Done when: `rg -n 'RecordingIndicator' apps/web/src` prints nothing and the file no longer exists.

### 18. [x] Add the live sound waveform

- Add `getStream(): MediaStream | null` to `MediaRecorderRecorder`.
- Return a stable `getAudioStream` from `usePersonalLog`.
- Add `apps/web/src/hooks/useAudioLevel.ts` using `AudioContext` + `AnalyserNode` on the recorder stream.
- Add `apps/web/src/components/Waveform.tsx` (SVG bars, one rect per level).
- Add `apps/web/src/components/Waveform.test.tsx`.
- Render the waveform above the timer in `RecorderView`, using `state.status === "recording"` as the active flag.

Done when: `rg -n 'getStream|getAudioStream|useAudioLevel|Waveform' apps/web/src` matches, and `pnpm -C apps/web exec vitest run src/components/Waveform.test.tsx` passes.

### 19. [x] Add bottom breathing room

Add `pb-6` to the `main` element in `AppShell` so the transcript never touches the viewport bottom.

Done when: `rg -n 'pb-6' apps/web/src/components/AppShell.tsx` matches.

### 20. [x] Update the web README

Update `apps/web/README.md` for the new primitives (`Badge`, `Progress`, `Popover`, `Command`), `Waveform`, `useAudioLevel`, and the guard exclusions.

Done when: `rg -n 'Badge|Progress|Popover|Command|Waveform|useAudioLevel' apps/web/README.md` matches.

### 21. [x] Full verification

From the repo root:

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

Done when: both commands exit 0.

### 22. [x] Preview smoke check

```bash
pnpm -C apps/web exec vite preview --port 4173 >/tmp/pl9-preview.log 2>&1 &
sleep 3
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/
lsof -ti :4173 | xargs kill
```

Done when: curl prints `200` and the server is stopped.

### 23. [x] Browser checklist (user performs)

1. Idle: shadcn default record button, no transcript area.
2. Recording: live waveform above the timer, timer centered at 5rem, no spinning icon.
3. Waveform moves with speech and flattens on pause; timer digits stay stable.
4. Language badge is small and sits inline to the right of the title.
5. Pause/stop/play buttons use shadcn variants and sizes.
6. Transcript fills to the bottom with visible padding; long text scrolls internally and follows new text.
7. Playback uses the shadcn progress bar and the same title/badge row.
8. Theme is the shadcn neutral dark palette; no yellow remains.

Done when: the checklist is included in the report.

### 24. [x] Make the whole waveform move

In `apps/web/src/hooks/useAudioLevel.ts`, switch from `getByteFrequencyData` to `getByteTimeDomainData`:

- Set `analyser.fftSize = 2048`.
- Allocate `Uint8Array(analyser.fftSize)`.
- Split the buffer into `BAR_COUNT` equal segments and take each segment's peak amplitude.
- Normalize with a gain so bars are visible (`Math.min(1, peak * 2.5)`).

Done when: `pnpm -C apps/web typecheck` exits 0 and `rg -n 'getByteTimeDomainData' apps/web/src/hooks/useAudioLevel.ts` matches.

### 25. [x] Increase waveform/timer spacing and recording control size

- `RecorderView`: add `mb-4` to the waveform className.
- `PauseResumeButton` and `StopButton`: use `size="icon-lg" className="size-12"` and `size-5` on the icons.
- `RecorderView` title row: change `gap-3` to `gap-5`.

Done when: `rg -n 'mb-4' apps/web/src/views/RecorderView.tsx` matches, `rg -n 'size-12' apps/web/src/components/PauseResumeButton.tsx apps/web/src/components/StopButton.tsx` matches both, and `rg -n 'gap-5' apps/web/src/views/RecorderView.tsx` matches.

### 26. [x] Full verification

From the repo root:

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

Done when: both commands exit 0.

### 27. [x] Browser checklist (user performs)

1. Waveform across the whole width moves with speech, not only the left third.
2. More space between the waveform and the timer.
3. Pause/stop controls are visibly larger than before.
4. Title and language badge have clear horizontal spacing.

Done when: the checklist is included in the report.

### 28. [x] Extract the generic Combobox component

Create `apps/web/src/components/Combobox.tsx` with the shadcn `Popover` + `Command` UI and props for `value`, `options`, `query`, `onQueryChange`, `onChange`, `label`, `searchPlaceholder`, `emptyLabel`, `placeholder`, `disabled`, `className` and `contentClassName`.

Rewrite `apps/web/src/components/LanguageSelect.tsx` as a thin adapter:

- Keep the `query` state in `LanguageSelect`.
- Filter with `searchLanguages(query)`.
- Map to `{ value: code, label, description: english }`.
- Pass `label="Transcription language"`, `searchPlaceholder="Search languages"`, and the empty label.

Done when: `test -f apps/web/src/components/Combobox.tsx`, `rg -n 'Combobox' apps/web/src/components/LanguageSelect.tsx` matches, `rg -n 'Command|Popover' apps/web/src/components/LanguageSelect.tsx` prints nothing, and `pnpm -C apps/web exec vitest run src/components/LanguageSelect.test.tsx` passes.

### 29. [x] Pin the language tag to the right

In `apps/web/src/views/RecorderView.tsx`, change the shared title row to `flex w-full items-center justify-between gap-5 self-start` so the title stays left and the badge is pinned right in both recording and playback.

Done when: `rg -n 'justify-between' apps/web/src/views/RecorderView.tsx` matches and `rg -n 'w-full items-center justify-between' apps/web/src/views/RecorderView.tsx` matches.

### 30. [x] Smooth the waveform motion

In `apps/web/src/hooks/useAudioLevel.ts`:

- Throttle updates to roughly 20 fps (`50ms`).
- Low-pass filter each bar against its previous value (`previous * 0.8 + next * 0.2`).
- Keep the time-domain peak calculation.

Done when: `rg -n '50' apps/web/src/hooks/useAudioLevel.ts`, `rg -n '0\.8|0\.2' apps/web/src/hooks/useAudioLevel.ts` match, and `pnpm -C apps/web typecheck` exits 0.

### 31. [x] Full verification

From the repo root:

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

Done when: both commands exit 0.

### 32. [x] Browser checklist (user performs)

1. Language dropdown is the extracted `Combobox`; search and selection still work.
2. Language badge is pinned to the far right of the title row in recording and playback.
3. Waveform moves smoothly and slowly, with no jitter.

Done when: the checklist is included in the report.

### 33. [x] Split the component layers

Create:

- `apps/web/src/views/RecorderView/components/`
- `apps/web/src/views/PlaybackView/`
- `apps/web/src/views/components/`

Move each view screen into its own folder and add a barrel:

- `views/RecorderView.tsx` → `views/RecorderView/RecorderView.tsx`
- `views/PlaybackView.tsx` → `views/PlaybackView/PlaybackView.tsx`
- Add `views/RecorderView/index.ts` exporting `RecorderView`
- Add `views/PlaybackView/index.ts` exporting `PlaybackView`

Move and rename:

- `components/Timer.tsx` + `.test.tsx` → `views/RecorderView/components/`
- `components/Transcript.tsx` + `.test.tsx` → `views/RecorderView/components/`
- `components/Waveform.tsx` + `.test.tsx` → `views/RecorderView/components/`
- `components/RecordingTitle.tsx` → `views/RecorderView/components/`
- `components/RecordButton.tsx` → `views/RecorderView/components/`
- `components/PauseResumeButton.tsx` → `views/RecorderView/components/`
- `components/StopButton.tsx` → `views/RecorderView/components/`
- `components/LanguageSelect.tsx` → `views/components/LanguageSelector.tsx`
- `components/LanguageSelect.test.tsx` → `views/components/LanguageSelector.test.tsx`

Rename the exported `LanguageSelect` component to `LanguageSelector`.

Done when: the moved files exist at their new paths, `test ! -f apps/web/src/views/RecorderView.tsx`, `test ! -f apps/web/src/views/PlaybackView.tsx`, `test ! -f apps/web/src/components/LanguageSelect.tsx`, and `rg -n 'LanguageSelect' apps/web/src` prints nothing.

### 34. [x] Update imports for the new layers

Update all imports so:

- `views/RecorderView/RecorderView.tsx` imports recorder-specific components from `@/views/RecorderView/components/...` and `LanguageSelector` from `@/views/components/LanguageSelector`.
- `App.tsx` keeps importing `RecorderView` from `@/views/RecorderView` through the new barrel.
- Moved components import pure UI primitives from `@/components/...`.
- `LanguageSelector.test.tsx` imports `./LanguageSelector` and renders `<LanguageSelector />`.
- No view-specific component remains under `src/components/`.

Done when: `pnpm -C apps/web typecheck` exits 0 and `rg -n '@/components/(Timer|Transcript|Waveform|RecordingTitle|RecordButton|PauseResumeButton|StopButton|LanguageSelect)' apps/web/src` prints nothing.

### 35. [x] Document the architecture

Update `apps/web/README.md` and `AGENTS.md`:

- `src/components/` — pure UI lib building blocks only.
- `src/views/<View>/` — a screen folder: `index.ts` barrel, `<View>.tsx` screen and `components/` for components owned by that view.
- `src/views/components/` — shared view-layer components with some business/domain logic but not tied to one view (e.g. `LanguageSelector`).
- Update the placement rules and examples; keep the raw-element guard accurate.

Done when: `rg -n 'views/<View>|views/components|LanguageSelector' apps/web/README.md AGENTS.md` matches both files.

### 36. [x] Full verification

From the repo root:

```bash
pnpm install && pnpm build && pnpm test
pnpm -C apps/web lint
```

Done when: both commands exit 0.

### 37. [x] Browser checklist (user performs)

1. Idle, recording and playback screens still render and work.
2. Language selector still searches and selects.
3. Waveform, timer, title, badge and transcript behave as before.
4. No visual regressions from the file moves.

Done when: the checklist is included in the report.

### 38. [x] Commit (HELD — do not run)

Stop before running it and report the exact command and message. The orchestrator asks the user for approval.

```bash
git add -A && git commit -m "PL-9: shadcn defaults, live waveform, component layers"
```

Done when: the commit is reported as held; mark this step `[x]` only after the user approves and the commit is made.

### 39. [x] Mark remaining checkboxes

After the commit, mark any remaining unchecked checkboxes in this file.

Done when: every checkbox in this file is `[x]`.
