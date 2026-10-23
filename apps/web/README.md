# Personal Log — web app

React 19 + TypeScript + Vite + Tailwind v4. Single-page recorder UI.

## Layered source layout (`src/`) — two levels only

- `components/` — the UI component **lib**: pure, presentational components
  only (props in → JSX out; no core access, no app-level decisions), one
  simple component per file. It spans the raw-element primitive wrappers
  (`Text`, `Button`, `Input`, `List`/`ListItem`, `Audio`) and composed pure
  components (`Timer`, `Transcript`, `AppShell`, `PlaybackProgressBar`,
  `LanguageSelect` + its leaves, the recorder buttons). Flat — no `ui/`
  subfolder.
- `views/` — business-logic screens: the PersonalLog core wiring
  (`RecorderView`), audio playback control (`PlaybackView`).
- `views/components/` — optional: view-specific components that are neither
  pure-lib UI nor reusable; created only when needed. None today.

Support layers: `hooks/` (`usePersonalLog` wires the core), `lib/` (pure
non-React logic and data: `languages`, `languageSearch` — the language codes
are a curated list because the platform has no API to enumerate languages;
labels come from `Intl.DisplayNames`).

## Rules

1. Only the lib's primitive files (`Text`, `Button`, `Input`, `List`,
   `ListItem`, `Audio`) render raw HTML primitives. `<p>`, `<span>`,
   `<button>`, `<input>`, `<ul>`, `<li>`, `<audio>` directly are forbidden
   anywhere else.
2. Visible text always goes through `Text` (`size`, `muted`, `as`).
   Interactive controls always go through `Button` etc. — never a bare
   `<button>`.
3. Layout-only `<div>`s (flex containers, wrappers, panels) are fine in any
   layer.
4. Placement: pure → `components/`, business view → `views/`, view-specific
   non-pure component → `views/components/`, raw element → a `components/`
   primitive first.
5. shadcn is the adopted primitive system: registry components via the CLI
   (`components.json` points `ui` at `@/components`, so adds land flat —
   rename the generated files to PascalCase and update imports afterwards);
   registry-less primitives (`Text`, `List`/`ListItem`, `Audio`) are authored
   in shadcn house style, never bespoke one-offs.

## Guard

```bash
rg -n '<(button|input|p|span|ul|li|audio)[ >]' src -g '*.tsx' -g '!src/components/{Text,Button,Input,List,ListItem,Audio}.tsx'
```

should print nothing.

**Component-library shadcn note:** `components.json` preset is `radix-nova`;
the CLI may write to a literal `@/` directory or append theme CSS to
`index.css` — move generated files into `src/components/` and report the
diffs.