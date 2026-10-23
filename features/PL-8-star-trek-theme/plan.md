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

### 12. [ ] Commit (held)

Run only after user approval: `git add -A && git commit -m "PL-8: UI theme + recording title"`
Then mark checkboxes.

Done when: user approves commit.