# PL-7 — Pure UI components vs views

## Goal

The web app's React code is split so that `components/` contains only pure,
presentational UI components and `views/` holds everything that touches
business logic (core calls, app state shaping). App code never renders raw
HTML primitives directly except layout-only `<div>`s — text must go through a
Typography component and interactive elements through `components/ui/*`.

## Tech stack

- **UI primitives:** shadcn (already adopted: `components.json` preset
  `radix-nova`, CLI-generated `components/ui/button.tsx`, `cn`, CVA and
  radix-ui installed). Registry components are added via the shadcn CLI
  (`input`); registry-less primitives (`Text` typography, `List`/`ListItem`,
  `Audio`) are authored as `components/ui/` files in shadcn house style.
- **Styling:** Tailwind with the existing CSS-variable theme tokens
  (`text-muted-foreground`, `border-border`, …)
- **Icons:** lucide-react (already in use)

## Rules for the final state

1. **`views/`** — anything wired to business logic: calling the core
   (start/stop/pause/resume, setLanguage), deriving app-level flags,
   orchestrating feature areas. `App.tsx` currently does all of this and
   should move into — or reduce to a thin wrapper around — a view. Views may
   contain a `views/components/` folder for view-specific components that
   are neither pure lib UI nor reusable — created only when needed.
2. **`components/`** — the UI component **lib**: flat (two levels only —
   `components/` and `views/`, no `components/ui/` nesting). It spans
   primitive wrappers and composed pure components, each one simple,
   presentational component per file: props in, rendering out; no core
   access, no app business decisions. Pure components embedded inside mixed
   files must be extracted so each file is one simple component.
3. **Primitive wrappers live flat in `components/`** (PascalCase: `Button`,
   `Input`, `Text`, `List`/`ListItem`, `Audio`) and are the only files
   allowed to render raw HTML primitives. shadcn is the adopted system:
   registry components via the CLI; registry-less primitives authored in
   shadcn house style.
4. **Primitives elsewhere are forbidden.** Specifically:
   - `<button>` (and any interactive primitive) may only appear inside
     `components/ui/`. The existing hand-rolled buttons
     (`RecordButton`, `StopButton`, `PauseResumeButton`, the select trigger
     inside `LanguageSelect`) must be rebuilt on the shadcn `ui/button`, not
     raw `<button>` with bespoke classes. Likewise `input`, `ul`, `li` in
     `LanguageSelect` must move behind ui primitives (e.g. ui input, ui list)
     or the component must be split so only its pure leaves touch them.
   - Layout-only `<div>`s (flex containers, wrappers, panels) are fine in any
     layer — they are not styled primitives.
   - `<p>` and `<span>` are **not** exempt: a Typography component
     (`components/Text.tsx`) must own all
     visible text, with variants/weights/sizes as needed. Consumers:
     `Timer`, `Transcript`, the hidden-audio time readout in `Playback`, the
     `LanguageSelect` trigger/footer/option labels.

## Current state (what needs to move)

- `apps/web/src/App.tsx` — all business logic (hook wiring, start/stop/
  pause/setLanguage) lives here.
- `apps/web/src/components/LanguageSelect.tsx` — mixed: search/filtering
  logic, keyboard/focus logic, and raw `<button>/<input>/<ul>/<li>` markup in
  one file.
- `apps/web/src/components/Playback.tsx` — playback-control logic plus a raw
  `<audio>` element and button inside one file.
- `apps/web/src/components/RecorderControls.tsx` — records-state vs idle-state
  branching (pure decision, but sits in components/).
- `apps/web/src/components/{RecordButton,StopButton,PauseResumeButton}.tsx` —
  three separate components hand-rolling raw `<button>` with near-identical
  bespoke classes; good candidates to collapse into styled Button variants or
  thin wrappers over `ui/button`.
- `apps/web/src/components/ui/button.tsx` — exists (shadcn, `cn` + cva +
  radix Slot already wired), imported nowhere.
- Pure today and fine to keep as components (after primitive swap):
  `AppShell`, `Timer`, `Transcript`.

## Scope

- Create `views/` and move business-logic code there; thin out `App.tsx` to
  composition only.
- Extract pure components so `components/` holds simple presentational pieces
  only (e.g. the language popup's trigger, search field, and option list as
  separate pure leaves; `Playback`'s time text; the recorder button cluster).
- Build the primitive wrappers (`Text`, `Button`, `Input`, `List`/
  `ListItem`, `Audio`) flat in `components/` (registry components via the
  shadcn CLI) so no raw input/button/list primitives remain in
  views/components, and remove the interim `components/ui/` nesting.
- Rebuild the three recorder buttons on `ui/button`.
- Existing behavior, styling and tests keep working; tests updated/moved with
  the code they cover.

## References

- Conversation with the user (2026 — this work item's requirements); no
  braindump doc. Prior context: `features/PL-4-ui-improvements/spec.md`
  introduced the current components (Amendment 2: no record button while
  recording).