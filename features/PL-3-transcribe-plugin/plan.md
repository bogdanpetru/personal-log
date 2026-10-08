# PL-3 — Transcribe plugin — execution plan

## Goal

PL-3 is done when the app's live transcription no longer touches `SpeechRecognition`
directly: it flows through a `LiveTranscriptionPlugin` interface defined in
`packages/plugin-api`, implemented by `packages/plugins/transcription-native` (Web Speech
API), registered explicitly in the app, and composed with a recording-only `useRecorder`.

When finished, these must pass from the repo root:

```bash
pnpm -r --if-present typecheck
pnpm -r --if-present test
pnpm build
```

and the app must behave as in PL-1 (manual browser checklist in the verification step).

## Ground rules

- Work from the repo root.
- Do steps in order. Each step has a **Done when** check — it must pass before moving on.
- When a step's **Done when** passes, mark that step's checkbox `[x]` in this file before starting the next step.
- If a command fails: stop, report the exact error, current state, and fix options, then wait. Do not improvise or skip.
- Never edit files outside the repo root.
- Never run `git commit` — the commit step is **held**: stop before it and report the prepared commit (exact command + message); the orchestrator asks the user for approval.

## Steps

### 1. [x] Workspace globs + root scripts + shared tsconfig base

1. Edit `pnpm-workspace.yaml` to exactly:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "packages/plugins/*"
```

(The spec assumed `packages/*` covers `packages/plugins/transcription-native` — it does
not, that package is two levels deep. `packages/plugins/*` covers all future plugins too.)

2. Edit `package.json` (repo root) to exactly:

```json
{
  "name": "personal-log",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm -C apps/web dev",
    "build": "pnpm -C apps/web build",
    "preview": "pnpm -C apps/web preview",
    "test": "pnpm -r --if-present test",
    "typecheck": "pnpm -r --if-present typecheck"
  }
}
```

(`pnpm -r --if-present` runs tests/typecheck in every workspace package that has the
script, so the new packages are included automatically; apps/web keeps its existing
`test` script.)

3. Create `tsconfig.base.json` at the repo root — the shared base that every
   plugin package's tsconfig extends, so compiler options are never repeated:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

(`apps/web` keeps its existing Vite-template tsconfigs — it does not extend the
base in this ticket. TypeScript 6: no `baseUrl` anywhere — it is deprecated;
when a package needs path aliases, `paths` entries are relative.)

4. Run `pnpm install` — must report no errors and no
   "no projects matched the filters" warnings.

**Done when:** `pnpm-workspace.yaml`, root `package.json`, and root
`tsconfig.base.json` match the blocks above and `pnpm install` succeeds.

### 2. [x] Create `packages/plugin-api`

Create three files. Interfaces follow architecture doc §5.

1. `packages/plugin-api/package.json`:

```json
{
  "name": "@personal-log/plugin-api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc -p . --noEmit"
  },
  "devDependencies": {
    "typescript": "~6.0.2"
  }
}
```

(Packages are consumed as TypeScript source via `exports` — no build step, matching how
apps/web already compiles with `tsc -b` + Vite.)

2. `packages/plugin-api/tsconfig.json` — extends the shared base from step 1;
   no per-package overrides needed:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

(Extends paths are relative to the extending file, so the depth differs per
package — `../../` from `packages/plugin-api`, `../../../` from
`packages/plugins/transcription-native`.)

3. `packages/plugin-api/src/index.ts`:

```ts
export interface TranscriptionCapabilities {
  live: boolean;
  local: boolean;
  languages: string[];
  offline: boolean;
}

export interface AudioInput {
  blob: Blob;
}

export interface TranscriptionOptions {
  language?: string;
}

export interface TranscriptionResult {
  text: string;
}

export interface TranscriptionPlugin {
  id: string;
  name: string;
  capabilities(): TranscriptionCapabilities;
  initialize(config: unknown): Promise<void>;
  transcribe(
    input: AudioInput,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult>;
  dispose(): Promise<void>;
}

export interface LiveTranscriptionSession {
  onPartialResult(callback: (text: string) => void): void;
  onFinalResult(callback: (text: string) => void): void;
  stop(): Promise<TranscriptionResult>;
}

export type LiveTranscriptionOptions = TranscriptionOptions;

export interface LiveTranscriptionPlugin extends TranscriptionPlugin {
  startLive(
    options?: LiveTranscriptionOptions,
  ): Promise<LiveTranscriptionSession>;
}
```

4. Run `pnpm install && pnpm -C packages/plugin-api typecheck` (install always from
   the repo root — pnpm installs the whole workspace from any subdir, but the root is
   unambiguous).

**Done when:** the three files exist and `pnpm -C packages/plugin-api typecheck` exits 0.

### 3. [x] Create `packages/plugins/transcription-native` (skeleton + ambient types)

Move the Web Speech API ambient declarations out of the app into this plugin package —
after the refactor the app never touches `SpeechRecognition`; only this package does.

1. `packages/plugins/transcription-native/package.json`:

```json
{
  "name": "@personal-log/plugin-transcription-native",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p . --noEmit"
  },
  "dependencies": {
    "@personal-log/plugin-api": "workspace:*"
  },
  "devDependencies": {
    "jsdom": "^30.1.2",
    "typescript": "~6.0.2",
    "vite": "^8.3.0",
    "vitest": "^5.0.3"
  }
}
```

(`vite` is a direct devDependency because `vitest.config.ts` imports
`defineConfig` from `"vite"` and the tsconfig `types` includes `"vite/client"` —
pnpm does not hoist, so the vite that vitest depends on transitively is not
resolvable from this package. Same version as apps/web.)

2. `packages/plugins/transcription-native/tsconfig.json` — extends the shared
   base from step 1; the only override is the test type globals:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
```

(Any future plugin package — whisper, storage — extends the same base the same
way, overriding only what differs.)

3. `packages/plugins/transcription-native/src/speech-recognition.d.ts` — copy
   `apps/web/src/types/speech-recognition.d.ts` verbatim:

```ts
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
```

4. Run `pnpm install` from the repo root and verify the workspace link:

```bash
ls packages/plugins/transcription-native/node_modules/@personal-log
```

**Done when:** the three files exist and the command above lists `plugin-api`.
(`apps/web` gets its own `node_modules/@personal-log` links in step 5, when its
`package.json` gains the dependency declarations — workspace links appear only in
the packages that declare the dependency, so they are not in the root
`node_modules` at all.)

### 4. [x] transcription-native: implementation + tests

Deviation (toolchain drift, executor-approved per skill rule 4): TS 6's `lib.dom`
now ships native `SpeechRecognition*` interfaces, so the plan's ambient
`speech-recognition.d.ts` merges with them and the test fake's object literals
must be cast (`as unknown as SpeechRecognitionResult`) to satisfy the merged
interface.

Tests are baked in: the implementation and its tests land in the same step, never a
later one. Write `packages/plugins/transcription-native/src/index.ts` with the Web
Speech API behavior extracted verbatim from `useRecorder` (continuous, interim
results, auto-restart on `onend` while the session is active):

```ts
/// <reference path="./speech-recognition.d.ts" />
//
// The triple-slash reference above is load-bearing: when `apps/web` (or any other
// package) imports this file, its TS program would otherwise not load the sibling
// ambient declarations, and `SpeechRecognition` would be an unknown name.
import type {
  LiveTranscriptionPlugin,
  LiveTranscriptionSession,
  TranscriptionCapabilities,
  TranscriptionOptions,
  TranscriptionResult,
} from "@personal-log/plugin-api";

export class NativeSpeechUnsupportedError extends Error {
  constructor() {
    super("SpeechRecognition is not supported in this browser");
    this.name = "NativeSpeechUnsupportedError";
  }
}

export function createNativeTranscriptionPlugin(): LiveTranscriptionPlugin {
  const speechConstructor = (): SpeechRecognitionConstructor | undefined =>
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  return {
    id: "native-speech",
    name: "Native speech recognition (Web Speech API)",

    capabilities(): TranscriptionCapabilities {
      const supported = speechConstructor() !== undefined;
      // Honest reporting only: what the browser exposes via SpeechRecognition.
      // There is no way to *verify* local/offline processing from this API yet,
      // so we do not claim false positives. Enforcement arrives in a later
      // work item.
      return { live: supported, local: false, offline: false, languages: [] };
    },

    async initialize(): Promise<void> {
      // Native plugin needs no configuration yet.
    },

    async dispose(): Promise<void> {
      // No persistent resources yet.
    },

    async transcribe(): Promise<TranscriptionResult> {
      throw new Error("transcription-native implements live transcription only");
    },

    async startLive(
      options?: TranscriptionOptions,
    ): Promise<LiveTranscriptionSession> {
      const Ctor = speechConstructor();
      if (!Ctor) {
        throw new NativeSpeechUnsupportedError();
      }

      const speech = new Ctor();
      speech.continuous = true;
      speech.interimResults = true;
      if (options?.language) {
        speech.lang = options.language;
      }

      let active = true;
      let finalText = "";
      let onPartial: ((text: string) => void) | undefined;
      let onFinal: ((text: string) => void) | undefined;

      speech.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += `${result[0].transcript} `;
          } else {
            interim += result[0].transcript;
          }
        }
        if (interim !== "" && onPartial) onPartial(interim);
        if (finalText !== "" && onFinal) onFinal(finalText.trimEnd());
      };
      speech.onend = () => {
        if (active) {
          speech.start();
        }
      };
      speech.start();

      return {
        onPartialResult(callback) {
          onPartial = callback;
        },
        onFinalResult(callback) {
          onFinal = callback;
        },
        async stop(): Promise<TranscriptionResult> {
          active = false;
          speech.stop();
          return { text: finalText.trimEnd() };
        },
      };
    },
  };
}
```

Then write the tests for that implementation, in the same step.

1. `packages/plugins/transcription-native/vitest.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// jsdom: the plugin guards on `window.*` — a non-browser window with no
// SpeechRecognition is the unsupported baseline the capabilities test needs.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

2. `packages/plugins/transcription-native/src/index.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createNativeTranscriptionPlugin, NativeSpeechUnsupportedError } from "./index.js";
// Ambient SpeechRecognition types come from src/speech-recognition.d.ts via the
// package tsconfig `include: ["src"]` — global augmentation, no import needed.

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  continuous = false;
  interimResults = false;
  lang = "";
  started = 0;
  stopped = 0;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.started += 1;
  }

  stop() {
    this.stopped += 1;
  }

  abort() {
    this.stopped += 1;
  }

  // test helper: emit a recognition event
  emit(results: { isFinal: boolean; transcript: string }[]) {
    const list = {
      length: results.length,
    } as SpeechRecognitionResultList;
    results.forEach((r, i) => {
      list[i] = {
        isFinal: r.isFinal,
        length: 1,
        0: { transcript: r.transcript, confidence: 1 },
      };
    });
    this.onresult?.({
      resultIndex: Math.max(0, results.length - 1),
      results: list,
    } as SpeechRecognitionEvent);
  }
}

function installFakeSpeech(): void {
  (window as unknown as Record<string, unknown>).SpeechRecognition =
    FakeSpeechRecognition as unknown;
  FakeSpeechRecognition.instances = [];
}

function removeFakeSpeech(): void {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
}

afterEach(removeFakeSpeech);

describe("native transcription plugin", () => {
  it("reports unsupported capabilities without SpeechRecognition", () => {
    removeFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    expect(plugin.capabilities()).toEqual({
      live: false,
      local: false,
      offline: false,
      languages: [],
    });
  });

  it("reports live capability when SpeechRecognition exists", () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    const caps = plugin.capabilities();
    expect(caps.live).toBe(true);
  });

  it("startLive throws NativeSpeechUnsupportedError when unsupported", async () => {
    removeFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    await expect(plugin.startLive()).rejects.toBeInstanceOf(
      NativeSpeechUnsupportedError,
    );
  });

  it("startLive configures continuous + interim recognition", async () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    await plugin.startLive();
    const speech = FakeSpeechRecognition.instances[0];
    expect(speech.continuous).toBe(true);
    expect(speech.interimResults).toBe(true);
    expect(speech.started).toBe(1);
  });

  it("emits partial and final results through the callbacks", async () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    const session = await plugin.startLive();
    const partials: string[] = [];
    const finals: string[] = [];
    session.onPartialResult((t) => partials.push(t));
    session.onFinalResult((t) => finals.push(t));

    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: false, transcript: "hel" }]);
    speech.emit([{ isFinal: false, transcript: "hello wo" }]);
    speech.emit([{ isFinal: true, transcript: "hello world" }]);

    expect(partials).toEqual(["hel", "hello wo"]);
    expect(finals).toEqual(["hello world"]);
  });

  it("accumulates final text across results and returns it from stop()", async () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    const session = await plugin.startLive();
    const finals: string[] = [];
    session.onFinalResult((t) => finals.push(t));
    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: true, transcript: "one two" }]);
    speech.emit([{ isFinal: true, transcript: "three" }]);

    expect(finals).toEqual(["one two", "one two three"]);

    const result = await session.stop();
    expect(result.text).toBe("one two three");
    expect(speech.stopped).toBe(1);
  });

  it("restarts recognition on end while the session is active, not after stop", async () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    const session = await plugin.startLive();
    const speech = FakeSpeechRecognition.instances[0];
    expect(speech.started).toBe(1);

    speech.onend?.();
    expect(speech.started).toBe(2); // auto-restart while active

    await session.stop();
    speech.onend?.();
    expect(speech.started).toBe(2); // no restart after stop
  });

  it("transcribe() promises unimplemented (live-only plugin)", async () => {
    const plugin = createNativeTranscriptionPlugin();
    await expect(
      plugin.transcribe({ blob: new Blob(["x"]) }),
    ).rejects.toThrow(/live transcription only/);
  });

  it("honors a language option", async () => {
    installFakeSpeech();
    const plugin = createNativeTranscriptionPlugin();
    await plugin.startLive({ language: "de-DE" });
    expect(FakeSpeechRecognition.instances[0].lang).toBe("de-DE");
  });
});
```

Notes for this step:
- Vitest 5: config uses `globals: true` — tsconfig already has
  `"types": ["vitest/globals"]` plus explicit imports above keep it robust either way.

3. Run `pnpm -C packages/plugins/transcription-native typecheck && pnpm -C packages/plugins/transcription-native test` — all tests pass.

**Done when:** `src/index.ts`, `vitest.config.ts`, and `src/index.test.ts` all exist
and both commands exit 0 with every test passing.

### 5. [x] App refactor: registry + split hooks + tests

1. Create `apps/web/src/lib/plugins.ts` — explicit registry, native plugin is the single
   default (architecture doc §11):

```ts
import { createNativeTranscriptionPlugin } from "@personal-log/plugin-transcription-native";
import type { LiveTranscriptionPlugin } from "@personal-log/plugin-api";

export const transcriptionPlugins: LiveTranscriptionPlugin[] = [
  createNativeTranscriptionPlugin(),
];

export const defaultTranscriptionPlugin: LiveTranscriptionPlugin =
  transcriptionPlugins[0];
```

2. Create `apps/web/src/hooks/useTranscription.ts` — live transcription via the plugin
   interface only (behavior extracted from the old `useRecorder` transcription half):

```ts
import { useRef, useState } from "react";
import { defaultTranscriptionPlugin } from "@/lib/plugins";
import type { LiveTranscriptionSession } from "@personal-log/plugin-api";

interface UseTranscription {
  transcript: string;
  partial: string;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useTranscription(): UseTranscription {
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [supported] = useState(
    () => defaultTranscriptionPlugin.capabilities().live,
  );

  const sessionRef = useRef<LiveTranscriptionSession | null>(null);
  const finalTextRef = useRef("");

  const start = async () => {
    const session = await defaultTranscriptionPlugin.startLive();
    finalTextRef.current = "";
    session.onFinalResult((text) => {
      finalTextRef.current = text;
      setTranscript(text);
    });
    session.onPartialResult((text) => {
      setPartial(text);
    });
    sessionRef.current = session;
  };

  const stop = () => {
    if (!sessionRef.current) return;
    void sessionRef.current.stop();
    sessionRef.current = null;
    setPartial("");
  };

  return { transcript, partial, supported, start, stop };
}
```

3. Rewrite `apps/web/src/hooks/useRecorder.ts` — recording concerns only
   (microphone, `MediaRecorder`), no `SpeechRecognition` anywhere:

```ts
import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording";

interface UseRecorder {
  status: RecorderStatus;
  start: () => Promise<void>;
  stop: () => void;
}

export function useRecorder(): UseRecorder {
  const [status, setStatus] = useState<RecorderStatus>("idle");

  const statusRef = useRef<RecorderStatus>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    if (statusRef.current === "recording") {
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
    if (statusRef.current !== "recording") {
      return;
    }
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    statusRef.current = "idle";
    setStatus("idle");
  };

  return { status, start, stop };
}
```

4. Rewrite `apps/web/src/App.tsx` — compose both hooks:

```tsx
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";

export default function App() {
  const { status, start: startRecording, stop: stopRecording } =
    useRecorder();
  const {
    transcript,
    partial,
    supported,
    start: startTranscription,
    stop: stopTranscription,
  } = useTranscription();

  const recording = status === "recording";

  const start = async () => {
    await startRecording();
    try {
      await startTranscription();
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {recording && (
        <p className="animate-pulse text-sm text-red-500">recording</p>
      )}
      <Button onClick={handleToggle} disabled={!supported}>
        {recording ? "Listening" : "Start"}
      </Button>
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

5. Edit `apps/web/package.json` — the app must **declare** the workspace dependencies,
   otherwise pnpm never links them into `apps/web/node_modules` and neither vite nor
   `tsc -b` can resolve the imports:

   - In `"dependencies"`, add these two entries as the first keys of the object
     (before `"@fontsource-variable/geist"`):

   ```json
   "@personal-log/plugin-api": "workspace:*",
   "@personal-log/plugin-transcription-native": "workspace:*",
   ```

   - In `"scripts"`, add this entry after `"test"`:

   ```json
   "typecheck": "tsc -b",
   ```

   (The app has no `typecheck` script today; with it, the root
   `pnpm -r --if-present typecheck` covers the app too, and it is the same `tsc -b`
   its build already runs.)

6. Delete `apps/web/src/types/speech-recognition.d.ts` (moved to the plugin package in
   step 3; the app must no longer know about `SpeechRecognition` — verify with the next
   item's grep). Confirm the empty `apps/web/src/types/` directory is removed too.

7. `grep -rn "SpeechRecognition" apps/web/src --include="*.ts" --include="*.tsx"` must
   return **no** matches.

8. Rewrite `apps/web/src/App.test.tsx` in the same step (tests baked in):

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the start button", () => {
  render(<App />);
  const button = screen.getByRole("button", { name: "Start" });
  expect(button).toBeInTheDocument();
});

test("button is disabled when transcription is unsupported (jsdom)", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
});

test("shows no recording indicator before recording", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});
```

(In jsdom neither `MediaRecorder` nor `SpeechRecognition` exists, so `supported` is
false and the button must be disabled — this pins PL-1's "disabled when unavailable"
behavior.)

9. Run, in order:

```bash
pnpm install
ls apps/web/node_modules/@personal-log   # must list plugin-api and plugin-transcription-native
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
```

**Done when:** the files match the blocks above, the grep returns nothing, the `ls`
lists both packages, and typecheck, test, and lint all exit 0.

### 6. [x] Full verification

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

Then hand this browser checklist to the user via the report (executor: include it
verbatim; only the user can check final items):

- [ ] `pnpm dev` opens the app at http://localhost:5173
- [ ] "Start" button is labelled "Start" and enabled in Chrome
- [ ] Pressing it switches to "Listening" and shows the pulsing "recording" text
- [ ] Final transcript appears under the button while speaking, interrupted by muted interim text
- [ ] Pressing again stops: "recording" disappears, transcript remains

### 7. [ ] Commit (HELD — stop before running)

Prepared commit (do **not** run; report and wait for user approval):

```bash
git add -A && git commit -m "PL-3: transcribe plugin"
```

**Done when:** stopped and reported, with `git status` output attached.

### 8. [ ] Mark remaining checkboxes

After the commit lands (orchestrator-approved), mark every remaining `[ ]` in this file
as `[x]` and confirm in the report that all steps are checked.

**Done when:** every checkbox in this file is `[x]`.
