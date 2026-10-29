# Personal Log — web app

React 19 + TypeScript + Vite + Tailwind v4. Single-page recorder UI.

## Layered source layout (`src/`)

- `components/` — the **pure UI lib**: simple, reusable building blocks only
  (props in → JSX out; no core access, no app-level data, no business logic),
  one simple component per file. It holds the shadcn/registry primitives
  (`Button`, `Input`, `Badge`, `Progress`, `Slider`, `Select`, `Popover`, `Command`, `Combobox`),
  the authored primitives (`Text`, `Audio`) and the layout-only `AppShell`.
  Flat — no `ui/` subfolder.
- `views/<View>/` — a business-logic screen: an `index.ts` barrel, a
  `<View>.tsx` screen, and a `components/` folder for components owned by
  that view. Examples: `views/RecorderView/RecorderView.tsx`,
  `views/PlaybackView/PlaybackView.tsx`.
- `views/<View>/components/` — components owned by one view, composed from
  the UI lib, with view-specific semantics. Example:
  `views/RecorderView/components/RecordButton.tsx`.
- `views/components/` — shared view-layer components: more than pure UI
  (some domain/business logic) but not tied to a single view. Example:
  `views/components/LanguageSelector.tsx`.

Support layers: `hooks/` (`usePersonalLog` wires the core, `useAudioLevel`
drives the live waveform from the recorder stream), `lib/` (pure non-React
logic and data: `settings` (persisted defaults), `logTitle`, `audio/`
(recording formats and the lazy FFmpeg conversion), `languages`,
`languageSearch` — the language codes are a
curated list because the platform has no API to enumerate languages; labels
come from `Intl.DisplayNames`).

## Rules

1. Only the lib's shadcn/registry primitive files (`Text`, `Button`, `Input`,
   `Badge`, `Progress`, `Slider`, `Select`, `Popover`, `Command`, `Combobox`, `Audio`) render raw HTML
   primitives. `<p>`, `<span>`, `<button>`, `<input>`, `<ul>`, `<li>`,
   `<audio>` directly are forbidden anywhere else.
2. Visible text always goes through `Text` (`size`, `muted`, `as`).
   Interactive controls always go through `Button` etc. — never a bare
   `<button>`.
3. Layout-only `<div>`s (flex containers, wrappers, panels) are fine in any
   layer.
4. Placement: pure reusable building block → `components/`; component owned
   by one screen → `views/<View>/components/`; domain/business logic not tied
   to one screen → `views/components/`; screen wiring →
   `views/<View>/<View>.tsx`; raw element → a `components/` primitive first.
5. shadcn is the adopted primitive system: registry components live flat in
   `components/` with PascalCase names (`components.json` points `ui` at
   `@/components`; rename generated files and update imports after CLI adds).
   Registry-less primitives (`Text`, `Audio`) are authored in shadcn house
   style, never bespoke one-offs.

## Guard

```bash
rg -n '<(button|input|p|span|ul|li|audio)[ >]' src -g '*.tsx' -g '!src/components/{Text,Button,Input,Badge,Progress,Slider,Select,Popover,Command,Combobox,Audio}.tsx'
```

should print nothing.

**Component-library shadcn note:** `components.json` preset is `radix-nova`;
the CLI may write to a literal `@/` directory or append theme CSS to
`index.css` — move generated files into `src/components/` and report the
diffs.