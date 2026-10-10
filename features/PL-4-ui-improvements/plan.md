# PL-4 — UI improvements: record button, pause/resume, language selector — execution plan

## Goal

PL-4 is done when the recorder app shows a large round record button (solid red circle
when idle; a black square centered inside while recording), a small pause/resume button
beside it (only while recording has started), a transcription-language dropdown
(defaulting to `navigator.language`, falling back to `en-US`), and the pulsing
"recording" indicator text is gone. Pausing stops the recognition session but keeps
mic recording and the visible transcript; resuming appends to the same transcript.

When finished, these must pass from the repo root:

```bash
pnpm install
pnpm -r --if-present typecheck
pnpm -r --if-present test
pnpm build
```

and the dev server must answer 200 (manual browser checklist in the verification step).

### Decisions baked into this plan (resolved spec ambiguities — no judgment calls needed)

- **Pause also pauses the `MediaRecorder`** (`MediaRecorder.pause()` /
  `resume()`): a recorder pause pauses the recording, and the mic stream stays open.
  The recognition session is *fully stopped* on pause (per spec) and restarted on
  resume.
- **Recorder gains a `"paused"` status** (`"idle" | "recording" | "paused"`), so the
  record button keeps showing the black square while paused (per spec) and the
  pause button shows "Resume".
- **Each new recording resets the transcript.** The transcript belongs to the current
  recording. While a recording is paused, the accumulated text stays visible (per
  spec), and resume appends to it by seeding a base text before starting a new
  recognition session (the plugin accumulates final text per session).
- **Resume reuses the language captured at recording start** (`optionsRef` inside
  `useTranscription`) — the spec's "no live switch while recording".
- **The language `<select>` is disabled while recording** (visible but inert).
- **The pause/resume button uses text labels** ("Pause"/"Resume"); icon polish can
  come in a later UI item.
- `apps/web/src/components/ui/button.tsx` (shadcn) stays in the repo untouched —
  only `App.tsx` stops importing it.

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Language table: `apps/web/src/lib/languages.ts` + tests

1. Create `apps/web/src/lib/languages.ts` — the curated static list (spec: final list
   defined here) with BCP-47 codes passed to `startLive({ language })`:

```ts
export interface LanguageOption {
  /** BCP-47 code passed to the transcription plugin. */
  code: string;
  /** Native name shown in the selector. */
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en-US", label: "English" },
  { code: "en-GB", label: "English (UK)" },
  { code: "de-DE", label: "Deutsch" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "it-IT", label: "Italiano" },
  { code: "pt-BR", label: "Português" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "sv-SE", label: "Svenska" },
  { code: "pl-PL", label: "Polski" },
  { code: "uk-UA", label: "Українська" },
  { code: "ru-RU", label: "Русский" },
  { code: "tr-TR", label: "Türkçe" },
  { code: "ar-SA", label: "العربية" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "zh-CN", label: "中文" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
];

export const FALLBACK_LANGUAGE = "en-US";

export function defaultLanguage(): string {
  const browser = navigator.language;
  const known = LANGUAGES.some((language) => language.code === browser);
  return known ? browser : FALLBACK_LANGUAGE;
}
```

(Exact-match only: `en-AU` etc. is not in the list, so it falls back to `en-US` —
per spec. Re-evaluated on every load; never persisted.)

2. Create `apps/web/src/lib/languages.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { defaultLanguage, FALLBACK_LANGUAGE, LANGUAGES } from "./languages";

function setNavigatorLanguage(code: string): void {
  Object.defineProperty(window.navigator, "language", {
    value: code,
    configurable: true,
  });
}

afterEach(() => {
  // Remove the own-property override; the jsdom Navigator.prototype getter
  // ("en-US") becomes visible again.
  Reflect.deleteProperty(window.navigator, "language");
});

describe("language table", () => {
  it("has unique BCP-47 codes", () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("contains the fallback language", () => {
    expect(
      LANGUAGES.some((language) => language.code === FALLBACK_LANGUAGE),
    ).toBe(true);
  });
});

describe("defaultLanguage()", () => {
  it("returns the browser language when it is in the list", () => {
    setNavigatorLanguage("de-DE");
    expect(defaultLanguage()).toBe("de-DE");
  });

  it("falls back to en-US for unknown browser languages", () => {
    setNavigatorLanguage("zz-ZZ");
    expect(defaultLanguage()).toBe("en-US");
  });
});
```

3. Run:

```bash
pnpm -C apps/web test src/lib/languages.test.ts
pnpm -C apps/web typecheck
```

**Done when:** both files exist and both commands exit 0.

### 2. [x] `useTranscription`: language option + pause/resume-safe accumulation

Rewrite `apps/web/src/hooks/useTranscription.ts` in full. The pause button will call
this hook's `stop()` (ending only the recognition session; the recording continues),
and resume calls `resume()`, which seeds `baseRef` with the current transcript so the
new session's final results append to it (each session starts its own accumulation in
the plugin):

```ts
import { useMemo, useRef, useState } from "react";
import type { TranscriptionOptions } from "@personal-log/plugin-api";
import { defaultTranscriptionPlugin } from "@/lib/plugins";

interface UseTranscription {
  transcript: string;
  partial: string;
  supported: boolean;
  start: (options?: TranscriptionOptions) => Promise<void>;
  stop: () => void;
  resume: () => Promise<void>;
}

export function useTranscription(): UseTranscription {
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const supported = useMemo(
    () => defaultTranscriptionPlugin.capabilities().live,
    [],
  );

  const stopSessionRef = useRef<(() => Promise<unknown>) | null>(null);
  // Text accumulated before the currently running recognition session. Every
  // session reports its own accumulated final text, so appending across
  // pause/resume boundaries needs the pre-session text as the base.
  const baseRef = useRef("");
  // Options of the current recording; resume() reuses them, so the language
  // never switches live mid-recording (spec PL-4).
  const optionsRef = useRef<TranscriptionOptions | undefined>(undefined);

  const beginSession = async () => {
    const session = await defaultTranscriptionPlugin.startLive(optionsRef.current);
    session.onFinalResult((text) => {
      const base = baseRef.current;
      setTranscript(base === "" ? text : `${base} ${text}`);
    });
    session.onPartialResult((text) => {
      setPartial(text);
    });
    stopSessionRef.current = () => session.stop();
  };

  const start = async (options?: TranscriptionOptions) => {
    optionsRef.current = options;
    baseRef.current = "";
    setTranscript("");
    setPartial("");
    await beginSession();
  };

  // Ends the recognition session only. Keeps the accumulated transcript —
  // used for pausing a live recording and for stopping it entirely.
  const stop = () => {
    if (!stopSessionRef.current) return;
    void stopSessionRef.current();
    stopSessionRef.current = null;
    setPartial("");
  };

  const resume = async () => {
    baseRef.current = transcript;
    await beginSession();
  };

  return { transcript, partial, supported, start, stop, resume };
}
```

`App.tsx` still compiles unchanged against this widened API (its calls use the same
members; `start`'s argument is optional).

**Done when:** `pnpm -C apps/web typecheck` exits 0 and the file matches the block above.

> Deviation (orchestrator fix): the plan's import of `TranscriptionOptions` from
> `@personal-log/plugin-api` required a one-line addition to
> `packages/plugin-api/src/index.ts` — `export type { TranscriptionOptions } from "./types.js";`
> (type-only barrel re-export; the package root had never exported it).

### 3. [x] `useRecorder`: `"paused"` status + pause/resume

Rewrite `apps/web/src/hooks/useRecorder.ts` in full. Adds `pause`/`resume` via
`MediaRecorder.pause()`/`resume()` (mic stream stays open) and widens the stop guard
so stopping works from `"paused"` too:

```ts
import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "paused";

interface UseRecorder {
  status: RecorderStatus;
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function useRecorder(): UseRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");

  const statusRef = useRef<RecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    if (statusRef.current !== "idle") {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.start();

    statusRef.current = "recording";
    setStatus("recording");
  };

  const stop = () => {
    if (statusRef.current === "idle") {
      return;
    }
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    statusRef.current = "idle";
    setStatus("idle");
  };

  const pause = () => {
    if (statusRef.current !== "recording") {
      return;
    }
    mediaRecorderRef.current?.pause();
    statusRef.current = "paused";
    setStatus("paused");
  };

  const resume = () => {
    if (statusRef.current !== "paused") {
      return;
    }
    mediaRecorderRef.current?.resume();
    statusRef.current = "recording";
    setStatus("recording");
  };

  return { status, start, stop, pause, resume };
}
```

**Done when:** `pnpm -C apps/web typecheck` exits 0 and the file matches the block above.

### 4. [x] `App.tsx`: record button, pause/resume button, language selector, tests

1. Rewrite `apps/web/src/App.tsx` in full. Plain `<button>`s with Tailwind (no shadcn
   `Button`); record button is 150×150px, fully rounded, red when idle with a black
   40×40px square centered while recording; the pulsing "recording" `<p>` is gone; the
   transcript block below is byte-for-byte unchanged:

```tsx
import { useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { defaultLanguage, LANGUAGES } from "@/lib/languages";

export default function App() {
  const {
    status,
    start: startRecording,
    stop: stopRecording,
    pause: pauseRecording,
    resume: resumeRecording,
  } = useRecorder();
  const {
    transcript,
    partial,
    supported,
    start: startTranscription,
    stop: stopTranscription,
    resume: resumeTranscription,
  } = useTranscription();
  const [language, setLanguage] = useState(defaultLanguage());

  const recording = status !== "idle";
  const paused = status === "paused";

  const start = async () => {
    await startRecording();
    try {
      await startTranscription({ language });
    } catch (error) {
      stopRecording();
      throw error;
    }
  };

  const handleToggle = () => {
    if (recording) {
      stopTranscription();
      stopRecording();
    } else {
      void start();
    }
  };

  const handleTogglePause = () => {
    if (paused) {
      // Resume transcription first; if it fails, the recorder stays paused and
      // the user can retry or press the record button to stop.
      void resumeTranscription()
        .then(() => resumeRecording())
        .catch(() => undefined);
    } else {
      pauseRecording();
      pauseTranscription();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <select
        aria-label="Transcription language"
        className="block w-48 rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        disabled={recording}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={recording ? "Stop recording" : "Start recording"}
          disabled={!supported}
          onClick={handleToggle}
          className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-red-600 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {recording && (
            <span aria-hidden className="block h-10 w-10 bg-black" />
          )}
        </button>
        {recording && (
          <button
            type="button"
            aria-label={paused ? "Resume recording" : "Pause recording"}
            onClick={handleTogglePause}
            className="h-10 rounded-full border border-border px-4 text-sm"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        )}
      </div>
      {(transcript !== "" || partial !== "") && (
        <p className="max-w-prose whitespace-pre-wrap text-center">
          {transcript}
          {partial !== "" && (
            <span className="text-muted-foreground"> {partial}</span>
          )}
        </p>
      )}
    </main>
  );
}
```

2. Rewrite `apps/web/src/App.test.tsx` in the same step (tests baked in). In jsdom
   `navigator.language` is `"en-US"` (in the list), `SpeechRecognition` is undefined so
   the record button is disabled, and the pause button never renders when idle:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the record button", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: "Start recording" }),
  ).toBeInTheDocument();
});

test("record button is disabled when transcription is unsupported (jsdom)", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: "Start recording" }),
  ).toBeDisabled();
});

test("pause button is not visible before recording", () => {
  render(<App />);
  expect(
    screen.queryByRole("button", { name: "Pause recording" }),
  ).not.toBeInTheDocument();
});

test("language selector defaults to the browser language (jsdom en-US)", () => {
  render(<App />);
  const select = screen.getByRole("combobox", {
    name: "Transcription language",
  }) as HTMLSelectElement;
  expect(select.value).toBe("en-US");
});

test("shows no recording indicator text", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});
```

3. Run, in order:

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
```

**Done when:** the two files match the blocks above and all three commands exit 0.

> Deviation (orchestrator fix): typo in the plan's `App.tsx` block —
> `pauseTranscription()` is never destructured (the plan's step 2 prose says pause
> calls the hook's `stop()`, which exists). Corrected to `stopTranscription()`.

### 5. [x] Full verification

From the repo root, run all of these and fix any failures before continuing
(stop and report if a fix isn't obvious — do not improvise):

```bash
pnpm install
pnpm -r --if-present typecheck
pnpm -r --if-present test
pnpm build
pnpm -C apps/web dev &
sleep 5
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:5173/   # expect 200
kill %1
```

**Done when:** install, typecheck (all packages), tests (all packages), and build all
exit 0 and the dev server answers 200.

> Deviation (executor): did not spawn a second `pnpm -C apps/web dev`. Port 5173 was
> already occupied by this repo's own dev server (PID 59150, `vite` on
> `apps/web`), with the user's Chrome tab connected — killing it would close the
> user's page. Verified instead that the running server answers 200 and serves the
> new code (transformed `/src/App.tsx` contains the record button classes and the
> `stopTranscription()` pause path; HMR timestamp present).

Then hand the browser checklist to the user via the report (only the user can check
final items). Superseded 2026-10-10 by Amendment 1 — the original checklist
described the pre-amendment layout (black square beside the pause button, record
button doubles as stop) and is replaced by:

- [ ] `pnpm dev` opens the app at http://localhost:5173 (Chrome); [initial] shows
      the language dropdown above the big red round button — no timer, no stop
      pill, no playback row
- [ ] The dropdown defaults to the browser/system language, lists the curated
      languages with native names, is searchable, and is disabled while recording
- [ ] Click record: the red button is GONE — a ticking m:ss timer above a
      Pause/Resume pill takes its place, and a Stop pill appears at the top right
      of the screen
- [ ] While speaking, final transcripts appear under the controls with muted interim
      text (as before)
- [ ] Pause: the timer freezes, the pill shows Resume, the transcript stays;
      speech during the pause is NOT transcribed
- [ ] Resume: new speech appends to the same transcript and the timer keeps counting
- [ ] Stop: the top-right pill ends everything → readonly: play/pause pill +
      progress bar + position/duration readout under the red record button; the
      stop pill is gone
- [ ] Playback: the progress bar advances while playing, Play/Pause toggles it,
      and reaching the end returns the button to Play
- [ ] Stop without saying anything: the empty transcript triggers the fail rule —
      back to the initial state, no playback row
- [ ] Starting again from readonly discards the old playback and rewinds the timer;
      a new recording uses the language selected before it started
- [ ] In a browser without SpeechRecognition the record button is disabled

### Post-execution refactor (user request, 2026-10-09)

After step 5, the user directed: pure UI components never mix into consumers.
Extracted from `App.tsx` into `apps/web/src/components/` — `RecordButton`,
`PauseResumeButton`, `LanguageSelect`, then `AppShell`, `RecorderControls`,
`Transcript`. `App.tsx` now contains no raw JSX — hooks, handlers, and component
composition only. Re-verified: typecheck, 9/9 web tests, lint, build, dev server
200. The commit below includes all of it (explicit paths since `git add -A` would
sweep the pre-existing `.agents/skills/write-plan/SKILL.md` edit).

Follow-on user directives, same session:

- **Record button while recording:** the stop square replaces the red circle
  entirely (idle: 120px red round; recording: a slightly-rounded 48px square —
  `rounded-md`, gruvbox yellow `#fabd2f`, hover `#d79921` — centered inside the
  same fixed 120×120 container, so the controls never shift between states).
- **Searchable language select:** `LanguageSelect` rebuilt as an ARIA combobox —
  trigger button + popup with a search field and listbox; diacritic-insensitive
  matching over native names, codes, and new English names (added to
  `lib/languages.ts`); keyboard: arrows/Enter/Escape/Tab; new
  `components/LanguageSelect.test.tsx` (8 interaction tests).
- **Dracula theme, dark by default:** full Dracula palette saved as app tokens
  in `src/index.css`; record button red via a new `bg-record` token;
  hover/surface polish on the pause pill and select trigger.
  (Superseded same session by user: palette switched to **Gruvbox dark** —
  full palette saved in `src/index.css`; record button 120px with hover
  `bg-record-hover` darkening #fb4934 → #cc241d.)

- (A hard no-blur shadow-ring on the controls was tried and removed at the
  user's request — controls are flat.)

### 5b. [x] Amendment 1 — Apple Voice Recorder flow (user request, off-script)

Spec amended (see `spec.md` → "Amendment 1"): the app is a three-state machine
mimicking the Apple Voice Recorder; the fixed-container/reserved-slot layout and
the yellow stop square are superseded.

- **[initial]** red 120px round record button only.
- **[recording]** record button removed entirely; its place holds a ticking timer
  (`components/Timer.tsx`, m:ss, paused time excluded) above the pause/resume pill;
  a stop button (`components/StopButton.tsx`) is fixed at the top right of the
  screen; clicking stop ends recorder + transcription together → readonly.
- **[readonly]** red record button back (starts a new session, discarding the old);
  below it a `components/Playback.tsx` row — play/pause pill, progress bar filled
  from the audio `currentTime`/`duration`, and m:ss position/duration — remounted
  via `key={src}` so a new recording resets state without an effect.
- Timer lives in `useRecorder` (`seconds`): interval ticks while `recording`,
  pause/stop edges checkpoint elapsed ms, `start()` rewinds to zero; tested with
  fake timers (ticks / freezes / resets).
- `useRecorder` gained the timer; stop keeps building the playable blob; the
  empty-transcript fail rule and start-resets-everything semantics are kept.
- Deferred ("if possible"): highlighting the transcript word at the playback point
  in time needs a timed transcript source; the native Web Speech plugin provides
  none — recorded as deferred in Amendment 1.
- `--stop`/`--stop-hover` Gruvbox tokens removed (the yellow stop square is gone).
- Verified: `tsc` clean, 26/26 web tests, `oxlint` clean except the pre-existing
  `components/ui/button.tsx` warning. Implemented directly in-session (orchestrator,
  user-directed off-script work) rather than via the executor subagent.

### 5c. [x] Languages from `Intl.DisplayNames` (user request, off-script, 2026-10-10)

User asked whether the browser provides "all languages" so nothing needs hardcoding.
Answer recorded: there is no enumeration API (`Intl.supportedValuesOf` covers
calendars/currencies/time zones/units only; `navigator.languages` is the user's own
preferences). So the curated **code list stays** (the app decides what it offers; the
recognition engine must support what it gets) — but every display string is now
generated at runtime:

- `lib/languages.ts` maps ~66 BCP-47 codes (up from 18) through `Intl.DisplayNames`:
  native label from the primary subtag, sentence-cased (CLDR renders "français",
  "русский" lowercase); English name from the full code, feeding search.
- Labels for variant codes sharing a primary subtag (pt-BR/pt-PT, zh-CN/zh-TW,
  en-US/en-GB) keep the region name so list options stay distinguishable.
- Tests updated to real CLDR facts: casing, variant distinctness, English search
  matching both Chinese variants, Enter-select query `"swedish"`. 29/29 web tests,
  typecheck + lint clean.

### 6. [ ] Commit (HELD — stop before running)

Prepared commit (do **not** run; report and wait for user approval):

```bash
git add apps/web/src packages/plugin-api/src/index.ts features/PL-4-ui-improvements && git commit -m "PL-4: record button, pause/resume, language selector, voice-recorder flow"
```

> Amended 2026-10-10: explicit paths, because `git add -A` would sweep the
> unrelated pre-existing `.agents/skills/write-plan/SKILL.md` edit (see the
> post-execution refactor note in step 5). Message extended to cover the
> Amendment 1 shape.

**Done when:** stopped and reported, with `git status` output attached.

### 7. [ ] Mark remaining checkboxes

After the commit lands (orchestrator-approved), mark every remaining `[ ]` in this file
as `[x]` and confirm in the report that all steps are checked.

**Done when:** every checkbox in this file is `[x]`.