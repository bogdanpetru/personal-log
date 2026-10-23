# PL-7 — Pure UI components vs views

## Goal

`apps/web` is restructured so that `views/` holds everything with business
logic (core wiring, media control), `components/` holds only pure
presentational components, and `components/ui/` is the only place that renders
raw HTML primitives (typography, button, input, list, audio). Layout-only
`<div>`s are allowed anywhere. All existing tests pass unchanged; no visible
styling change.

Verification commands (from repo root) must pass at the end:

```bash
pnpm test && pnpm typecheck && pnpm build
```

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Notes

- Styling utility import: existing ui code uses `import { cn } from "cn"`.
- All files below live under `apps/web/src/` unless the path says otherwise.
- The bespoke class strings from the current components are carried over
  verbatim; `cn`/tailwind-merge resolves conflicts, so `ui/button` defaults
  (focus ring etc.) layer on top without changing the declared visuals.
- **shadcn is the adopted primitive system** (`components.json` preset
  `radix-nova`, `ui/button.tsx`, `shadcn/tailwind.css` imported in
  `apps/web/src/index.css`). Policy:
  - Where the registry has the component → add it with the CLI
    (`pnpm dlx shadcn@latest add <name>`), never hand-write it. Verified
    membership (2026-10, via `https://ui.shadcn.com/r/index.json`): `input`
    exists; `typography`, `list`, `list-item` do not.
  - Where the registry lacks the primitive → author a file in `ui/` in
    shadcn house style (lowercase filename, `data-slot`, `cn`, theme tokens).
  - CLI drift: shadcn 4.x may prompt despite `--yes`, may append theme utility
    CSS (e.g. `cn-input`) to `apps/web/src/index.css`, and may write to a
    literal `@/` directory — always verify the file landed under
    `apps/web/src/components/` and report any `index.css`/`package.json`
    changes the CLI made.
- **Architecture revision (2026-10, user decision — supersedes any `ui/`
  nesting in earlier steps):** only two levels exist — `components/` (the
  flat UI lib: primitives **and** composed pure components, **PascalCase**
  filenames like `Button.tsx`, `Text.tsx`) and `views/` (business logic;
  optional `views/components/` for view-specific non-pure components,
  created only when needed). Where earlier fenced steps still show
  `@/components/ui/...` paths or the `components/ui/` folder, step 13
  flattens and renames them — earlier steps' checkmarks stay valid.

## Steps

### 1. [x] Typography primitive + adopt in Timer and Transcript

Create `apps/web/src/components/ui/text.tsx`:

```tsx
import type { ElementType, HTMLAttributes } from "react";
import { cn } from "cn";

const sizes = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  display: "text-3xl",
} as const;

interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Rendered element — defaults to `<p>`; use "span" for inline text. */
  as?: ElementType;
  size?: keyof typeof sizes;
  /** Muted secondary color. */
  muted?: boolean;
}

/** Typography primitive: the only component allowed to render visible text. */
export function Text({
  as: Tag = "p",
  size = "base",
  muted = false,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(sizes[size], muted && "text-muted-foreground", className)}
      {...props}
    />
  );
}
```

Overwrite `apps/web/src/components/Timer.tsx`:

```tsx
import { Text } from "@/components/ui/text";

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
    <Text role="timer" size="display" className="tabular-nums">
      {format(seconds)}
    </Text>
  );
}
```

Overwrite `apps/web/src/components/Transcript.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { Text } from "@/components/ui/text";

interface TranscriptProps {
  transcript: string;
  partial: string;
  /** While true, arriving text scrolls the panel to the bottom (recording). */
  autoScroll?: boolean;
}

export function Transcript({
  transcript,
  partial,
  autoScroll = false,
}: TranscriptProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the newest transcription in view while the text streams in.
  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const panel = panelRef.current;
    if (panel !== null) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [autoScroll, partial, transcript]);

  if (transcript === "" && partial === "") {
    return null;
  }
  return (
    <div
      ref={panelRef}
      className="min-h-0 w-full max-w-prose flex-1 overflow-y-auto text-left"
    >
      {/* Pre-style wrapping preserves the paragraph breaks inserted on pause. */}
      <Text className="whitespace-pre-wrap">
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

**Done when:** `pnpm -C apps/web test` passes (Timer.test and Transcript.test
unchanged must still pass: `p` role=timer text, `querySelector("p")`, muted
partial class).

### 2. [x] Rebuild the three recorder buttons on ui/button

Overwrite `apps/web/src/components/RecordButton.tsx`:

```tsx
import { Button } from "@/components/ui/button";

interface RecordButtonProps {
  supported: boolean;
  onToggle: () => void;
}

export function RecordButton({ supported, onToggle }: RecordButtonProps) {
  return (
    <Button
      type="button"
      aria-label="Start recording"
      disabled={!supported}
      onClick={onToggle}
      className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-full bg-record transition-colors hover:bg-record-hover disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}
```

Overwrite `apps/web/src/components/StopButton.tsx`:

```tsx
import { Button } from "@/components/ui/button";

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <Button
      type="button"
      aria-label="Stop recording"
      onClick={onStop}
      className="h-10 cursor-pointer rounded-[3px] border border-border px-4 font-normal hover:bg-muted/50"
    >
      Stop
    </Button>
  );
}
```

Overwrite `apps/web/src/components/PauseResumeButton.tsx`:

```tsx
import { Button } from "@/components/ui/button";

interface PauseResumeButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export function PauseResumeButton({
  paused,
  onToggle,
}: PauseResumeButtonProps) {
  return (
    <Button
      type="button"
      aria-label={paused ? "Resume recording" : "Pause recording"}
      onClick={onToggle}
      className="h-10 cursor-pointer rounded-[3px] border border-border px-4 font-normal hover:bg-muted/50"
    >
      {paused ? "Resume" : "Pause"}
    </Button>
  );
}
```

Note: `font-normal` keeps the original (non-medium) trigger text weight
against `ui/button`'s `font-medium` default.

**Done when:**

```bash
rg -n '<button' apps/web/src/components -g '*.tsx' -g '!**/ui/**'
```

prints nothing, and `pnpm -C apps/web test` passes.

### 3. [x] Input via shadcn CLI; author list primitives

> **Deviation note (drift, handled per plan Notes):** the CLI wrote the file
> to a literal `apps/web/@/components/ui/input.tsx` directory instead of
> `src/`; it was moved to `apps/web/src/components/ui/input.tsx` and the
> stray tree removed. No `index.css` or `package.json` changes; the generated
> nova input uses hard-coded nova classes (no `cn-input` utility needed), so
> `LanguageSearchField` keeps the popup's transparent borderless look by
> overriding via `className` (idiomatic shadcn usage) instead of accepting
> the inset-field look.

`input` is in the core shadcn registry — add it with the CLI from
`apps/web` (shadcn is already initialized; no `init` re-run):

```bash
cd apps/web && pnpm dlx shadcn@latest add input --yes; cd ..
```

Verify that the landed file is real and capture the CLI's side effects:

```bash
test -f apps/web/src/components/ui/input.tsx && rg -n 'data-slot="input"' apps/web/src/components/ui/input.tsx
git status --porcelain apps/web/src
```

Expect: `apps/web/src/components/ui/input.tsx` (registry source uses the
`cn-input` utility, styled from theme CSS the CLI appends to
`apps/web/src/index.css` — report that index.css diff). If the CLI errors,
prompts, or writes outside `apps/web/src/`: stop and report per ground rules.

Create `apps/web/src/components/ui/list.tsx` (no `list` in the registry —
authored shadcn-style):

```tsx
import type { ComponentProps } from "react";
import { cn } from "cn";

interface ListProps extends ComponentProps<"ul"> {}

/** List primitive: wraps `<ul>` (lists, listboxes) with no default styling. */
export function List({ className, ...props }: ListProps) {
  return <ul data-slot="list" className={cn(className)} {...props} />;
}
```

Create `apps/web/src/components/ui/list-item.tsx` (also authored — no
registry equivalent):

```tsx
import type { ComponentProps } from "react";
import { cn } from "cn";

interface ListItemProps extends ComponentProps<"li"> {}

/** List item primitive: wraps `<li>`; row styling stays with the consumer. */
export function ListItem({ className, ...props }: ListItemProps) {
  return <li data-slot="list-item" className={cn("text-sm", className)} {...props} />;
}
```

**Done when:** `pnpm -C apps/web typecheck` passes.

**Done when:** `apps/web/src/components/ui/input.tsx` exists with the CLI's
content, `list.tsx`/`list-item.tsx` exist as authored, and
`pnpm -C apps/web typecheck` passes.

Note: the popup search row keeps the standard shadcn `Input` component, with
transparent/borderless overrides so the popup's bordered search row is
preserved (idiomatic `className` override on the shadcn primitive).

### 4. [x] Pure language-search lib + unit test

Create `apps/web/src/lib/languageSearch.ts`:

```ts
import { LANGUAGES } from "./languages";

/** Lowercased, diacritic-stripped form for accent-insensitive search. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Combining_Mark}/gu, "")
    .toLowerCase();
}

/** Filter the language list by native, English, or code match (ignoring diacritics). */
export function searchLanguages(query: string) {
  const needle = fold(query.trim());
  if (needle === "") {
    return LANGUAGES;
  }
  return LANGUAGES.filter((option) =>
    fold(`${option.label} ${option.english} ${option.code}`).includes(needle),
  );
}
```

Create `apps/web/src/lib/languageSearch.test.ts`:

```ts
import { expect, test } from "vitest";
import { searchLanguages } from "./languageSearch";

test("empty and blank queries return the full list", () => {
  expect(searchLanguages("").length).toBeGreaterThan(0);
  expect(searchLanguages("  ").length).toBe(searchLanguages("").length);
});

test("ignores diacritics: 'franc' matches Français", () => {
  expect(searchLanguages("franc").map((o) => o.code)).toContain("fr-FR");
});

test("matches the English name: 'chinese' matches 中文", () => {
  expect(searchLanguages("chinese").map((o) => o.code)).toContain("zh-CN");
});

test("matches codes: 'sv-SE' matches", () => {
  expect(searchLanguages("sv-SE").map((o) => o.code)).toContain("sv-SE");
});

test("no match returns an empty list", () => {
  expect(searchLanguages("zzz")).toHaveLength(0);
});
```

**Done when:** `pnpm -C apps/web test` passes.

### 5. [x] Decompose LanguageSelect into pure leaves + controller

Create `apps/web/src/components/LanguageOptionRow.tsx`:

```tsx
import { Check } from "lucide-react";
import { ListItem } from "@/components/ui/list-item";
import { Text } from "@/components/ui/text";

interface LanguageOptionRowProps {
  /** DOM id — target of the listbox's aria-activedescendant. */
  id: string;
  label: string;
  english: string;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onHighlight: () => void;
}

export function LanguageOptionRow({
  id,
  label,
  english,
  active,
  selected,
  onSelect,
  onHighlight,
}: LanguageOptionRowProps) {
  return (
    <ListItem
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={`cursor-pointer flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 ${active ? "bg-muted" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onMouseMove={onHighlight}
    >
      <Text as="span" size="sm" className="truncate">
        {label}
      </Text>
      {selected && (
        <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
      )}
      <Text as="span" size="xs" muted className="shrink-0">
        {english}
      </Text>
    </ListItem>
  );
}
```

Create `apps/web/src/components/LanguageOptions.tsx`:

```tsx
import type { LanguageOption } from "@/lib/languages";
import { List } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { LanguageOptionRow } from "./LanguageOptionRow";

export const LIST_ID = "transcription-language-listbox";

export function languageOptionId(code: string): string {
  return `transcription-language-${code}`;
}

interface LanguageOptionsProps {
  options: LanguageOption[];
  /** Code of the selected language. */
  value: string;
  activeIndex: number;
  query: string;
  onSelect: (code: string) => void;
  onHighlight: (index: number) => void;
}

export function LanguageOptions({
  options,
  value,
  activeIndex,
  query,
  onSelect,
  onHighlight,
}: LanguageOptionsProps) {
  return (
    <>
      <List id={LIST_ID} role="listbox" className="max-h-60 overflow-auto p-1">
        {options.map((option, index) => (
          <LanguageOptionRow
            key={option.code}
            id={languageOptionId(option.code)}
            label={option.label}
            english={option.english}
            active={index === activeIndex}
            selected={option.code === value}
            onSelect={() => onSelect(option.code)}
            onHighlight={() => onHighlight(index)}
          />
        ))}
      </List>
      {options.length === 0 && (
        <Text size="sm" muted className="border-t border-border px-3 py-2">
          No languages match "{query}"
        </Text>
      )}
    </>
  );
}
```

Create `apps/web/src/components/LanguageTrigger.tsx`:

```tsx
import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface LanguageTriggerProps extends ComponentProps<"button"> {
  /** Native name of the selected language (or raw code fallback). */
  label: string;
  open: boolean;
  /** id of the open listbox (aria-controls) — undefined while closed. */
  listId?: string;
  /** id of the keyboard-active option (aria-activedescendant). */
  activeId?: string;
  onToggle: () => void;
}

export function LanguageTrigger({
  label,
  open,
  listId,
  activeId,
  onToggle,
  ...props
}: LanguageTriggerProps) {
  return (
    <Button
      type="button"
      role="combobox"
      aria-label="Transcription language"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-autocomplete="list"
      aria-controls={listId}
      aria-activedescendant={activeId}
      onClick={onToggle}
      className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-border bg-transparent px-3 font-normal hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      <Text as="span" size="sm" className="truncate">
        {label}
      </Text>
      <ChevronDown
        aria-hidden="true"
        className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
      />
    </Button>
  );
}
```

Create `apps/web/src/components/LanguageSearchField.tsx`:

```tsx
import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LanguageSearchFieldProps extends ComponentProps<"input"> {}

/** Pure leaf: the search row of the language popup; all state sits above. */
export function LanguageSearchField(props: LanguageSearchFieldProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Search
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <Input
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search languages"
        className="h-auto border-none rounded-none bg-transparent px-0 py-0 text-sm md:text-sm dark:bg-transparent focus-visible:border-none focus-visible:ring-0"
        {...props}
      />
    </div>
  );
}
```

Overwrite `apps/web/src/components/LanguageSelect.tsx` (controller — keeps
only popup interaction state; no business logic):

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { searchLanguages } from "@/lib/languageSearch";
import { LANGUAGES } from "@/lib/languages";
import {
  LanguageOptions,
  LIST_ID,
  languageOptionId,
} from "./LanguageOptions";
import { LanguageSearchField } from "./LanguageSearchField";
import { LanguageTrigger } from "./LanguageTrigger";

interface LanguageSelectProps {
  /** BCP-47 code of the selected language. */
  value: string;
  disabled?: boolean;
  onChange: (language: string) => void;
}

export function LanguageSelect({
  value,
  disabled = false,
  onChange,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find((option) => option.code === value);
  const filtered = useMemo(() => searchLanguages(query), [query]);
  const activeOption = filtered[activeIndex];

  // Opening the popup puts focus in the search field.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const openPopup = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  const closePopup = () => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const commit = (code: string) => {
    onChange(code);
    closePopup();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePopup();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeOption) {
        commit(activeOption.code);
      }
      return;
    }
    if (filtered.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + filtered.length) % filtered.length,
      );
    } else if (event.key === "Tab") {
      // Let focus move, but the popup closes with it.
      closePopup();
    }
  };

  return (
    <div className="relative w-48">
      <LanguageTrigger
        ref={triggerRef}
        label={selected ? selected.label : value}
        open={open}
        disabled={disabled}
        listId={open ? LIST_ID : undefined}
        activeId={
          open && activeOption ? languageOptionId(activeOption.code) : undefined
        }
        onToggle={open ? closePopup : openPopup}
      />
      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={closePopup}
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <LanguageSearchField
              ref={inputRef}
              value={query}
              onChange={(event) => {
                // Typing always restarts keyboard navigation at the first result.
                setActiveIndex(0);
                setQuery(event.target.value);
              }}
              onKeyDown={handleInputKeyDown}
            />
            <LanguageOptions
              options={filtered}
              value={value}
              activeIndex={activeIndex}
              query={query}
              onSelect={commit}
              onHighlight={setActiveIndex}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

**Done when:** `pnpm -C apps/web test` passes — the existing
`LanguageSelect.test.tsx` must pass unchanged (combobox role/name, filtering,
Enter, Escape, click-select, empty state).

### 6. [x] Audio primitive, progress-bar component, views/PlaybackView

Create `apps/web/src/components/ui/audio.tsx`:

```tsx
import type { ComponentProps } from "react";
import { cn } from "cn";

interface AudioProps extends ComponentProps<"audio"> {}

/** Audio primitive: wraps `<audio>`; renders hidden by default. */
export function Audio({ className, ...props }: AudioProps) {
  return <audio data-slot="audio" className={cn("hidden", className)} {...props} />;
}
```

Create `apps/web/src/components/PlaybackProgressBar.tsx`:

```tsx
interface PlaybackProgressBarProps {
  max: number;
  current: number;
}

export function PlaybackProgressBar({
  max,
  current,
}: PlaybackProgressBarProps) {
  const progress =
    max > 0 ? `${Math.min(100, (current / max) * 100)}%` : "0%";
  return (
    <div
      role="progressbar"
      aria-label="Playback progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(current)}
      className="h-1.5 w-40 overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: progress }}
      />
    </div>
  );
}
```

Create the views directory with `apps/web/src/views/PlaybackView.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { Audio } from "@/components/ui/audio";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { PlaybackProgressBar } from "@/components/PlaybackProgressBar";

interface PlaybackViewProps {
  /** Object URL of the recorded audio. */
  src: string;
}

function formatSeconds(total: number): string {
  const whole = Math.floor(total);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function PlaybackView({ src }: PlaybackViewProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Playback resets when the source changes because the usage site remounts
  // this component with `key={src}` — state initializes fresh on a new
  // recording, and this cleanup only stops audio on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (audio === null) {
      return;
    }
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        aria-label={playing ? "Pause playback" : "Play recording"}
        onClick={handleToggle}
        className="h-10 cursor-pointer rounded-[3px] border border-border px-4 font-normal hover:bg-muted/50"
      >
        {playing ? "Pause" : "Play"}
      </Button>
      <PlaybackProgressBar max={duration} current={currentTime} />
      <Text as="span" size="xs" muted className="tabular-nums">
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </Text>
      <Audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const media = event.currentTarget.duration;
          setDuration(Number.isFinite(media) ? media : 0);
        }}
      />
    </div>
  );
}
```

Do **not** delete `components/Playback.tsx` yet (step 7 swaps the usage).

**Done when:** `pnpm -C apps/web typecheck && pnpm -C apps/web test` passes.

### 7. [x] views/RecorderView, thin App, delete moved code

Create `apps/web/src/views/RecorderView.tsx`:

```tsx
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PauseResumeButton } from "@/components/PauseResumeButton";
import { RecordButton } from "@/components/RecordButton";
import { StopButton } from "@/components/StopButton";
import { Timer } from "@/components/Timer";
import { Transcript } from "@/components/Transcript";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { PlaybackView } from "@/views/PlaybackView";
import { defaultLanguage } from "@/lib/languages";

export function RecorderView() {
  const { core, state, supported, playbackSrc } = usePersonalLog();
  const [language, setLanguage] = useState(defaultLanguage());

  // The language takes effect on the next recording (PL-4): the selector is
  // disabled while recording, so this only ever changes between sessions.
  useEffect(() => {
    core.setLanguage(language);
  }, [core, language]);

  const recording = state.status !== "idle";
  const paused = state.status === "paused";

  // Recording needs its transcription: a start failure (recorder or
  // recognizer) leaves the core idle and is surfaced by it; nothing to do here.
  const start = () => {
    void core.record().catch(() => undefined);
  };

  // Stop ends everything at once — recorder and transcription — and leaves
  // the completed log behind (playback of what was captured).
  const handleStop = () => {
    void core.stop();
  };

  const handleTogglePause = () => {
    if (paused) {
      // Resume transcription first; if it fails, the recorder stays paused and
      // the user can retry or press stop.
      void core.resume();
    } else {
      core.pause();
    }
  };

  return (
    <AppShell
      header={
        <>
          <LanguageSelect
            disabled={recording}
            value={language}
            onChange={setLanguage}
          />
          {recording && <StopButton onStop={handleStop} />}
        </>
      }
    >
      {/* Recording state: ticking timer + pause/resume pill below the header. */}
      {/* Readonly state: playback of what was captured (Amendment 2). */}
      {/* Initial state: the red record button, vertically centered — the */}
      {/* only state that ever centers. */}
      {recording ? (
        <div className="flex flex-col items-center gap-4">
          <Timer seconds={state.seconds} />
          <PauseResumeButton paused={paused} onToggle={handleTogglePause} />
        </div>
      ) : playbackSrc !== null ? (
        <PlaybackView key={playbackSrc} src={playbackSrc} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <RecordButton supported={supported} onToggle={start} />
        </div>
      )}
      <Transcript
        autoScroll={recording}
        transcript={state.transcript}
        partial={state.partial}
      />
    </AppShell>
  );
}
```

Overwrite `apps/web/src/App.tsx`:

```tsx
import { RecorderView } from "@/views/RecorderView";

export default function App() {
  return <RecorderView />;
}
```

Delete `apps/web/src/components/RecorderControls.tsx` and
`apps/web/src/components/Playback.tsx`:

```bash
rm apps/web/src/components/RecorderControls.tsx apps/web/src/components/Playback.tsx
```

**Done when:**

```bash
rg -n 'RecorderControls|components/Playback|"/Playback"' apps/web/src -g '*.tsx' -g '*.ts'
```

prints nothing, and `pnpm -C apps/web typecheck && pnpm -C apps/web test`
passes (`App.test.tsx` unchanged must still pass).

### 8. [x] Document the layered UI architecture (LLM + human readable)

Replace the outdated Vite boilerplate in `apps/web/README.md` with the
architecture doc:

```markdown
# Personal Log — web app

React 19 + TypeScript + Vite + Tailwind v4. Single-page recorder UI.

## Layered source layout (`src/`)

- `views/` — stateful screens wired to business logic: the PersonalLog core
  (`usePersonalLog`), audio playback control (`PlaybackView`, `RecorderView`).
- `components/` — pure, presentational components only: props in → JSX out;
  no core access, no app-level decisions. One simple component per file
  (`Timer`, `Transcript`, `LanguageSelect` + its pure leaves,
  `PlaybackProgressBar`, the recorder buttons…).
- `components/ui/` — UI primitives, the only place that renders raw HTML
  primitives: `Text` (typography), `Button`, `Input`, `List`/`ListItem`,
  `Audio`. shadcn-style lowercase files built on the Tailwind theme tokens.
  Where the shadcn registry has a component (button, input, …) it is added
  with the CLI (`pnpm dlx shadcn@latest add <name>`); registry-less
  primitives (Text typography, List/ListItem, Audio) are authored in the same
  house style.
- `hooks/` — framework hooks (`usePersonalLog` wires the core).
- `lib/` — pure non-React logic and data (`languages`, `languageSearch`).

## Rules

1. Layout-only `<div>`s (flex containers, wrappers, panels) are fine in any
   layer.
2. Any other raw element (`<button>`, `<input>`, `<p>`, `<span>`, `<ul>`,
   `<li>`, `<audio>`, …) may only appear inside `components/ui/`. Anything
   else consumes the ui primitive.
3. Visible text always goes through `ui/Text` (`size`, `muted`, `as`) —
   never a direct `<p>`/`<span>`.
4. Interactive controls always go through `ui/Button` etc. — never a bare
   `<button>`.
5. Placement: pure component → `components/`, business logic/state →
   `views/`, raw element → `components/ui/` first.
6. Registry primitives come from the shadcn CLI; only registry-less ones
   (`Text`, `List`/`ListItem`, `Audio`) are hand-written — and then in shadcn
   house style, never bespoke one-offs.

## Guard

```bash
rg -n '<(button|input|p|span|ul|li|audio)[ >]' src -g '*.tsx' -g '!src/components/ui/**'
```

should print nothing.
```

Then append a section to the repo-root `AGENTS.md`
(`/Users/b/dev/personal-log/AGENTS.md`), after the `## File layout` section:

```markdown

## UI layering (apps/web)

- `src/views/` — anything with business logic (core wiring, media control).
- `src/components/` — pure presentational components only, one simple
  component per file.
- `src/components/ui/` — UI primitives; the only place raw HTML primitives
  are allowed (`<button>`, `<input>`, `<p>`, `<span>`, `<ul>`, `<li>`,
  `<audio>`). Visible text goes through the `Text` typography primitive —
  never a direct `<p>`/`<span>`. Layout-only `<div>`s are allowed anywhere.
- Full conventions: `apps/web/README.md` (architecture doc, human + LLM
  readable).
```

**Done when:** `apps/web/README.md` no longer contains the "React + TypeScript +
Vite" template boilerplate and contains a "Layered source layout" section;
the repo-root `AGENTS.md` has the `## UI layering (apps/web)` section;
`pnpm -C apps/web typecheck && pnpm -C apps/web test` still passes.

### 9. [ ] Primitive guard + full verification

Run the guard — expect **no output**:

```bash
rg -n '<(button|input|p|span|ul|li|audio)[ >]' apps/web/src -g '*.tsx' -g '!apps/web/src/components/ui/**'
```

Then run the whole suite from the repo root:

```bash
pnpm test && pnpm typecheck && pnpm build
```

**Done when:** the guard prints nothing and all three commands exit 0.

Note: `<li>` etc. match `li>`/`li>` — the regex intent is: no raw `<button ...>`, `<input ...>`, `<p ...>`, `<span ...>`, `<ul ...>`, `<li ...>`, `<audio ...>` elements outside `components/ui/`. `<div>`, lucide icon components, and file names are irrelevant.

If the guard flags something: do not "fix" by redefining the check — rework the component so the primitive moves behind `components/ui/`, then report.

### 10. [ ] Browser checklist for the user

> Outstanding — the color-fix pass (step 15) and the commit landed before a
> fresh visual confirm. Re-run `pnpm -C apps/web dev` and confirm: trigger
> legibility (selected value, hover), pills no longer pink with readable
> text on hover, record page unchanged.

Start a dev server: `pnpm -C apps/web dev`. The executor puts this checklist in its report; the orchestrator hands it to the user:

- [ ] Header looks the same as before (language trigger styled as before, stop button pill while recording).
- [ ] Record page: 120px round red button, vertically centered, hover/disabled states as before (disabled headless).
- [ ] Language popup: opens on click, search filters (e.g. "franc" → Français), Enter selects, Escape closes, focus returns to trigger, empty-query footer shows "No languages match".
- [ ] While recording: timer ticks top-center, Pause/Resume pill works, Stop works.
- [ ] After a recording: play/pause button, progress bar, "m:ss / m:ss" time text all present.
- [ ] Known intended change: the language popup's search field is the standard shadcn `Input` component (transparent override keeps the previous look inside the bordered search row).

**Done when:** user confirms the checklist (no visual regression).

### 11. [x] Held commit — STOP BEFORE RUNNING

Proposed commit (executor stops here, orchestrator asks the user for approval):

```bash
git add -A && git commit -m "PL-7: split pure UI components from views; route all text and primitives through components/ui"
```

**Done when:** user approves; orchestrator runs the exact command above.

### 12. [x] Mark remaining checkboxes

Mark any remaining unchecked steps `[x]` in this file once the commit landed.

**Done when:** every checkbox is `[x]`.

> Committed: `bb52b3c` — message used: "PL-7: split pure UI components from
> views; flat component lib with Text/Button/Input/List/Audio primitives;
> comments dropped for self-explanatory code" (the message was updated at
> commit time since the plan's original referenced the flattened
> `components/ui` and pre-step-15 colors). Step 10 (visual confirm of the
> color fixes) remains outstanding and belongs to the user.

### 13. [x] Flatten `components/ui` into the `components` lib (architecture revision 2026-10)

Two levels only: `components/` (flat UI lib, primitives PascalCase) and
`views/` (+ optional `views/components/`).

a) Move primitive files flat and rename to PascalCase:

```bash
cd apps/web/src/components
mv ui/text.tsx Text.tsx
mv ui/button.tsx Button.tsx
mv ui/input.tsx Input.tsx
mv ui/list.tsx List.tsx
mv ui/list-item.tsx ListItem.tsx
mv ui/audio.tsx Audio.tsx
rmdir ui
cd ../../..
```

b) Rewrite imports (`list-item` before `list` so the longer match wins):

```bash
cd apps/web
rg -l '@/components/ui/' -g '*.tsx' src | xargs sed -i '' \
  -e 's|@/components/ui/text|@/components/Text|g' \
  -e 's|@/components/ui/button|@/components/Button|g' \
  -e 's|@/components/ui/input|@/components/Input|g' \
  -e 's|@/components/ui/list-item|@/components/ListItem|g' \
  -e 's|@/components/ui/list|@/components/List|g' \
  -e 's|@/components/ui/audio|@/components/Audio|g'
rg -n '@/components/ui/' src -g '*.ts*'; echo "$?"  # expect 1 (no matches)
cd ..
```

c) `apps/web/components.json`: change the `ui` alias from `@/components/ui`
to `@/components` (future CLI adds land flat; rename lowercase outputs to
PascalCase afterwards and note it).

d) Replace the README/AGENTS docs from step 8 with the flat-lib versions —
README rules 1–6 and the `## UI layering` AGENTS section rewritten to the
two-level model; the guard exclusion becomes the six flat primitive files.

e) Guard (should print nothing):

```bash
rg -n '<(button|input|p|span|ul|li|audio)[ >]' apps/web/src -g '*.tsx' -g '!apps/web/src/components/{Text,Button,Input,List,ListItem,Audio}.tsx'
```

f) Verify: `pnpm test && pnpm typecheck && pnpm build` from repo root.

**Done when:** `apps/web/src/components/ui/` no longer exists; the six
PascalCase primitive files exist; no `@/components/ui/` import remains;
guard is clean; full verification passes; README/AGENTS reflect the
flat two-level layout.

### 14. [x] Drop comments; add the self-explanatory rule to project conventions

- `apps/web/src` — every explanatory comment removed from all touched code
  (views, components, hooks, lib, tests); intent expressed via naming.
- Project rule added to repo-root `AGENTS.md` under File layout:
  "No comments in code — code must be self-explanatory."
- The one non-code platform constraint (codes are curated because `Intl`
  can't enumerate languages) moved to `apps/web/README.md`.

Done: guard comment-scan clean, `pnpm test && pnpm typecheck && pnpm build`
pass.

### 15. [x] Fix shadcn Button variant color bleed (user-reported regression)

Root cause: the Gruvbox theme defines `--primary: #d3869b` and
`--primary-foreground: #282828`; the shadcn default Button variant ships
`bg-primary text-primary-foreground hover:bg-primary/80`, and the consumer
overrides only swapped the surface, never the text color — leaving dark text
on dark surfaces (the language trigger) and pink fills where the background
wasn't overridden (play/pause pills). Half-opacity `hover:bg-muted/50` read
as background and made text unreadable.

Fix — every button built on `components/Button.tsx` now pins its own colors:

- `LanguageTrigger.tsx`: `bg-transparent text-foreground`, solid
  `hover:bg-muted`, `transition-colors` (restores).
- `StopButton.tsx`, `PauseResumeButton.tsx`, `PlaybackView` play/pause:
  `bg-transparent text-foreground font-normal`, solid `hover:bg-muted`.

Verified: `typecheck`, 32 tests, `build` all pass; browser check pending
for the user.