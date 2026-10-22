import { afterEach, expect, test, vi } from "vitest";
import type {
  LiveTranscriptionPlugin,
  Log,
  LogId,
  Recorder,
  StoragePlugin,
  TranscriptionOptions,
} from "@personal-log/plugin-api";
import { PersonalLog } from "./PersonalLog";

class FakeRecorder implements Recorder {
  started = 0;
  paused = 0;
  resumed = 0;
  stopped = 0;
  disposed = 0;
  failStart = false;

  async start(): Promise<void> {
    if (this.failStart) {
      throw new Error("mic denied");
    }
    this.started += 1;
  }

  pause(): void {
    this.paused += 1;
  }

  resume(): void {
    this.resumed += 1;
  }

  async stop() {
    this.stopped += 1;
    return { blob: new Blob(["audio"], { type: "audio/webm" }) };
  }

  dispose(): void {
    this.disposed += 1;
  }
}

class FakeTranscriber implements LiveTranscriptionPlugin {
  readonly id = "fake";
  readonly name = "Fake transcription";
  sessionsStarted = 0;
  sessionsStopped = 0;
  lastOptions: TranscriptionOptions | undefined;
  failStartLive = false;
  onPartial: ((text: string) => void) | undefined;
  onFinal: ((text: string) => void) | undefined;

  capabilities() {
    return { live: true, local: true, offline: true, languages: [] };
  }

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async startLive(options?: TranscriptionOptions) {
    if (this.failStartLive) {
      throw new Error("recognition unavailable");
    }
    this.sessionsStarted += 1;
    this.lastOptions = options;
    return {
      onPartialResult: (callback: (text: string) => void) => {
        this.onPartial = callback;
      },
      onFinalResult: (callback: (text: string) => void) => {
        this.onFinal = callback;
      },
      stop: async () => {
        this.sessionsStopped += 1;
        return { text: "" };
      },
    };
  }
}

class FakeStorage implements StoragePlugin {
  readonly id = "fake-storage";
  readonly name = "Fake storage";
  readonly logs = new Map<LogId, Log>();

  async initialize(): Promise<void> {}

  async save(log: Log): Promise<void> {
    this.logs.set(log.id, log);
  }

  async get(logId: LogId): Promise<Log | undefined> {
    return this.logs.get(logId);
  }

  async list(): Promise<Log[]> {
    return [...this.logs.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async delete(logId: LogId): Promise<void> {
    this.logs.delete(logId);
  }

  async dispose(): Promise<void> {
    this.logs.clear();
  }
}

function setup(withTranscriber = true, withStorage = true) {
  const recorder = new FakeRecorder();
  const transcriber = withTranscriber ? new FakeTranscriber() : undefined;
  const storage = withStorage ? new FakeStorage() : undefined;
  const core = new PersonalLog({ recorder, transcriber, storage });
  return {
    core,
    recorder,
    transcriber: transcriber as FakeTranscriber,
    storage,
  };
}

test("record starts the recorder and a live session with the selected language", async () => {
  const { core, recorder, transcriber } = setup();
  core.setLanguage("de-DE");
  await core.record();
  expect(core.getState().status).toBe("recording");
  expect(recorder.started).toBe(1);
  expect(transcriber.sessionsStarted).toBe(1);
  expect(transcriber.lastOptions).toEqual({ language: "de-DE" });
  expect(core.isTranscriptionSupported()).toBe(true);
});

test("without a transcriber the core runs record-only", async () => {
  const { core, recorder } = setup(false);
  expect(core.isTranscriptionSupported()).toBe(false);
  await core.record();
  expect(core.getState().status).toBe("recording");
  expect(recorder.started).toBe(1);
  await core.stop();
});

test("recorder start failure leaves the core idle", async () => {
  const { core, recorder } = setup();
  recorder.failStart = true;
  await expect(core.record()).rejects.toThrow("mic denied");
  expect(core.getState().status).toBe("idle");
});

test("transcription start failure stops the recorder, returns to idle, and emits error", async () => {
  const { core, recorder, transcriber } = setup();
  transcriber.failStartLive = true;
  const onError = vi.fn();
  core.on("error", onError);
  await expect(core.record()).rejects.toThrow("recognition unavailable");
  expect(recorder.stopped).toBe(1);
  expect(core.getState().status).toBe("idle");
  expect(onError).toHaveBeenCalledTimes(1);
});

test("partials stream in and a final commits the text, clearing the partial", async () => {
  const { core, transcriber } = setup();
  await core.record();
  transcriber.onPartial!("hel");
  expect(core.getState().partial).toBe("hel");
  transcriber.onFinal!("hello");
  const state = core.getState();
  expect(state.transcript).toBe("hello");
  expect(state.partial).toBe("");
});

test("pause freezes the session and inserts a paragraph break", async () => {
  const { core, recorder, transcriber } = setup();
  await core.record();
  transcriber.onFinal!("hello");
  core.pause();
  expect(core.getState().status).toBe("paused");
  expect(recorder.paused).toBe(1);
  expect(transcriber.sessionsStopped).toBe(1);
  expect(core.getState().transcript).toBe("hello\n");
  expect(core.getState().partial).toBe("");
});

test("pause with an empty transcript does not insert a break", async () => {
  const { core } = setup();
  await core.record();
  core.pause();
  expect(core.getState().transcript).toBe("");
});

test("resume continues appending across the session boundary", async () => {
  const { core, recorder, transcriber } = setup();
  await core.record();
  transcriber.onFinal!("hello");
  core.pause();
  await core.resume();
  expect(core.getState().status).toBe("recording");
  expect(recorder.resumed).toBe(1);
  expect(transcriber.sessionsStarted).toBe(2);
  // The new session reports its own total text; it lands below the break.
  transcriber.onFinal!("hello again");
  expect(core.getState().transcript).toBe("hello\nhello again");
});

test("resume failure keeps the session paused", async () => {
  const { core, recorder, transcriber } = setup();
  await core.record();
  core.pause();
  transcriber.failStartLive = true;
  await core.resume();
  expect(core.getState().status).toBe("paused");
  expect(recorder.resumed).toBe(0);
});

test("the timer ticks while recording and freezes while paused", async () => {
  vi.useFakeTimers();
  try {
    const { core } = setup(false);
    await core.record();
    vi.advanceTimersByTime(1500);
    expect(core.getState().seconds).toBe(1);

    core.pause();
    vi.advanceTimersByTime(3000);
    expect(core.getState().seconds).toBe(1);

    await core.resume();
    vi.advanceTimersByTime(1500);
    expect(core.getState().seconds).toBe(3);

    await core.stop();
    expect(core.getState().seconds).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});

test("stop saves the log, emits recorded, and resets the state", async () => {
  const { core, recorder, transcriber } = setup();
  core.setLanguage("de-DE");
  await core.record();
  transcriber.onFinal!("hello");
  const onRecorded = vi.fn();
  core.on("recorded", onRecorded);
  await core.stop();
  expect(recorder.stopped).toBe(1);
  expect(onRecorded).toHaveBeenCalledTimes(1);
  const log = onRecorded.mock.calls[0]![0];
  expect(log.transcriptions).toEqual([
    expect.objectContaining({
      providerId: "fake",
      language: "de-DE",
      text: "hello",
    }),
  ]);
  expect(log.audio.mimeType).toBe("audio/webm");
  expect(await core.getRecordings()).toEqual([log]);
  expect(core.getState()).toEqual({
    status: "idle",
    seconds: 0,
    transcript: "",
    partial: "",
  });
});

test("stopping with an empty transcript discards the log and saves nothing", async () => {
  const { core } = setup();
  await core.record();
  const onRecorded = vi.fn();
  const onDiscarded = vi.fn();
  core.on("recorded", onRecorded);
  core.on("discarded", onDiscarded);
  await core.stop();
  expect(onRecorded).not.toHaveBeenCalled();
  expect(onDiscarded).toHaveBeenCalledTimes(1);
  expect(await core.getRecordings()).toEqual([]);
  expect(core.getState().status).toBe("idle");
});

test("commands are guarded no-ops out of turn", async () => {
  const { core, recorder, transcriber } = setup();
  // Everything is a no-op while idle.
  core.pause();
  await core.resume();
  await core.stop();
  expect(recorder.started).toBe(0);
  await core.record();
  // A second record while recording does not restart anything.
  await core.record();
  expect(recorder.started).toBe(1);
  expect(transcriber.sessionsStarted).toBe(1);
  core.pause();
  core.pause();
  expect(recorder.paused).toBe(1);
  await core.stop();
});

test("deleteRecording removes the log from storage", async () => {
  const { core, transcriber } = setup();
  await core.record();
  transcriber.onFinal!("hello");
  await core.stop();
  const [log] = await core.getRecordings();
  await core.deleteRecording(log!.id);
  expect(await core.getRecordings()).toEqual([]);
});

test("without storage the log is still delivered but persisted nowhere", async () => {
  const { core, transcriber } = setup(true, false);
  await core.record();
  transcriber.onFinal!("hello");
  const onRecorded = vi.fn();
  core.on("recorded", onRecorded);
  await core.stop();
  expect(onRecorded).toHaveBeenCalledTimes(1);
  expect(await core.getRecordings()).toEqual([]);
  // Deleting is a no-op, not a failure.
  await core.deleteRecording("whatever");
});

test("state events fire and unsubscribing stops them", async () => {
  const { core } = setup(false);
  const listener = vi.fn();
  const unsubscribe = core.on("state", listener);
  await core.record();
  expect(listener).toHaveBeenCalled();
  const callsBefore = listener.mock.calls.length;
  unsubscribe();
  core.pause();
  expect(listener.mock.calls.length).toBe(callsBefore);
});

afterEach(() => {
  vi.restoreAllMocks();
});