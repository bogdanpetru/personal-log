import { appendTranscript } from "@personal-log/plugin-api";
import type {
  LiveTranscriptionPlugin,
  Log,
  LogData,
  LogId,
  LogQuery,
  Recorder,
  Recording,
  StoragePlugin,
  TranscriptionOptions,
} from "@personal-log/plugin-api";
import type { PersonalLogEvents } from "./PersonalLogEvents.js";
import type { PersonalLogOptions } from "./PersonalLogOptions.js";
import type { PersonalLogState } from "./PersonalLogState.js";

const TICK_MS = 250;

/**
 * The heart of the application: a headless orchestrator that ties an audio
 * recorder, an optional live transcriber, and a storage plugin into one
 * session state machine. The UI subscribes to it; the core knows nothing
 * about any UI.
 *
 *   idle → recording ⇄ paused → idle
 *
 * `stop()` returns to idle and delivers the completed log through the
 * "recorded" event and storage — a playback view is a UI concern, not core
 * state.
 */
export class PersonalLog {
  private readonly recorder: Recorder;
  private readonly transcriber: LiveTranscriptionPlugin | undefined;
  private readonly storage: StoragePlugin | undefined;

  private state: PersonalLogState = {
    status: "idle",
    seconds: 0,
    transcript: "",
    partial: "",
  };

  private readonly listeners: {
    [K in keyof PersonalLogEvents]: Set<PersonalLogEvents[K]>;
  } = {
    state: new Set(),
    recorded: new Set(),
    discarded: new Set(),
    error: new Set(),
  };

  // Text accumulated before the currently running recognition session. Every
  // session reports its own accumulated final text, so appending across
  // pause/resume boundaries needs the pre-session text as the base.
  private base = "";
  private stopSession: (() => Promise<unknown>) | null = null;
  // Language for the next recording; captured when a session starts so the
  // stored artifact names what was actually spoken.
  private language: string | undefined;
  private title: string | undefined;
  private activeLanguage: string | undefined;
  // Milliseconds of active recording before the current unbroken run.
  private elapsedMs = 0;
  // When the current unbroken run started; null while paused.
  private runStart: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: PersonalLogOptions) {
    this.recorder = options.recorder;
    this.transcriber = options.transcriber;
    this.storage = options.storage;
  }

  // ---- Events ----

  /** Subscribes; returns an unsubscribe function. */
  on<K extends keyof PersonalLogEvents>(
    event: K,
    listener: PersonalLogEvents[K],
  ): () => void {
    this.listeners[event].add(listener);
    return () => {
      this.listeners[event].delete(listener);
    };
  }

  private emit<K extends keyof PersonalLogEvents>(
    event: K,
    ...args: Parameters<PersonalLogEvents[K]>
  ): void {
    const typedListener = (listener: PersonalLogEvents[K]) => listener;
    for (const listener of [...this.listeners[event]]) {
      (typedListener(listener) as (...a: Parameters<PersonalLogEvents[K]>) => void)(
        ...args,
      );
    }
  }

  // ---- State ----

  /** Current snapshot; the same reference until the next state change. */
  getState(): PersonalLogState {
    return this.state;
  }

  private patchState(patch: Partial<PersonalLogState>): void {
    let changed = false;
    const next: PersonalLogState = { ...this.state };
    const nextRecord = next as Record<keyof PersonalLogState, unknown>;
    for (const key of Object.keys(patch) as (keyof PersonalLogState)[]) {
      const value = patch[key];
      if (value !== undefined && nextRecord[key] !== value) {
        nextRecord[key] = value;
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    this.state = next;
    this.emit("state", this.state);
  }

  // ---- Timer ----

  // Ticks only while actively recording. Pause/resume are the status-change
  // edges: leaving "recording" checkpoints the elapsed time so the total
  // freezes, entering it starts a fresh unbroken run.
  private startTimer(): void {
    this.runStart = Date.now();
    this.timer ??= setInterval(() => {
      const started = this.runStart;
      if (started !== null) {
        const seconds = Math.floor(
          (this.elapsedMs + (Date.now() - started)) / 1000,
        );
        this.patchState({ seconds });
      }
    }, TICK_MS);
  }

  private stopTimer(): void {
    this.checkpoint();
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private checkpoint(): void {
    if (this.runStart !== null) {
      this.elapsedMs += Date.now() - this.runStart;
      this.runStart = null;
    }
  }

  // ---- Transcription session ----

  private async beginSession(): Promise<void> {
    const options: TranscriptionOptions | undefined =
      this.activeLanguage === undefined
        ? undefined
        : { language: this.activeLanguage };
    const session = await this.transcriber!.startLive(options);
    session.onFinalResult((text) => {
      // The interim text being committed disappears, so it cannot linger
      // next to the committed double of itself. The shared append also trims
      // a tail the engine repeats at the session boundary, and joins
      // directly after a pause-inserted line break.
      this.patchState({
        partial: "",
        transcript: appendTranscript(this.base, text),
      });
    });
    session.onPartialResult((text) => {
      this.patchState({ partial: text });
    });
    this.stopSession = () => session.stop();
  }

  // Ends the recognition session only. Keeps the accumulated transcript —
  // used for pausing a live recording and for stopping it entirely.
  private endSession(): void {
    if (this.stopSession === null) {
      return;
    }
    const stop = this.stopSession;
    this.stopSession = null;
    void stop().catch((error: unknown) => {
      this.emit("error", error);
    });
    this.patchState({ partial: "" });
  }

  // ---- Commands ----

  /** Starts a new log. No-op unless idle; the previous session is discarded. */
  async record(): Promise<void> {
    if (this.state.status !== "idle") {
      return;
    }
    // Starting a new recording resets everything: timer, transcript, and the
    // recognition base — nothing from the last session survives.
    this.base = "";
    this.elapsedMs = 0;
    this.activeLanguage = this.language;
    await this.recorder.start();
    this.patchState({
      status: "recording",
      seconds: 0,
      transcript: "",
      partial: "",
    });
    this.startTimer();
    if (this.transcriber === undefined) {
      return;
    }
    try {
      await this.beginSession();
    } catch (error) {
      // Recording cannot work without its transcription: keep nothing and stay
      // in the initial state.
      this.stopTimer();
      void this.recorder.stop().catch(() => undefined);
      this.patchState({ status: "idle", seconds: 0 });
      this.emit("error", error);
      throw error;
    }
  }

  /** Freezes the timer and the transcript; resumed speech lands on a fresh line. */
  pause(): void {
    if (this.state.status !== "recording") {
      return;
    }
    this.checkpoint();
    this.recorder.pause();
    this.endSession();
    // A pause starts a new paragraph: the break lands at the end of the
    // transcript (only when there is text to break off).
    if (this.state.transcript !== "") {
      this.patchState({ transcript: `${this.state.transcript}\n` });
    }
    this.patchState({ status: "paused" });
  }

  /** Resumes; transcription resumes first — on failure the session stays paused. */
  async resume(): Promise<void> {
    if (this.state.status !== "paused") {
      return;
    }
    if (this.transcriber !== undefined) {
      // The session reports its own accumulated text, so the pre-session
      // transcript becomes the append base.
      this.base = this.state.transcript;
      try {
        await this.beginSession();
      } catch (error) {
        this.emit("error", error);
        return;
      }
    }
    this.recorder.resume();
    this.startTimer();
    this.patchState({ status: "recording" });
  }

  /** Ends the log: recorder and transcription stop together. */
  async stop(): Promise<void> {
    if (this.state.status === "idle") {
      return;
    }
    this.endSession();
    this.checkpoint();
    const recording = await this.recorder.stop();
    this.stopTimer();
    const durationMs = this.elapsedMs;
    const transcript = this.state.transcript;
    const language = this.activeLanguage;
    const title = this.title;

    this.base = "";
    this.elapsedMs = 0;
    this.activeLanguage = undefined;
    this.title = undefined;
    this.patchState({
      status: "idle",
      seconds: 0,
      transcript: "",
      partial: "",
    });

    // An empty transcript means nothing was actually recorded: treat the
    // recording as failed, keep nothing, and stay in the initial state.
    if (transcript === "") {
      this.emit("discarded", recording);
      return;
    }

    const { log, data } = this.buildLog(
      recording,
      durationMs,
      transcript,
      language,
      title,
    );
    try {
      await this.storage?.save(log, data);
    } catch (error) {
      // A persistence failure (quota, permissions) must not swallow the
      // recording: the log is still delivered to the caller, and the
      // failure is reported through the "error" event.
      this.emit("error", error);
    }
    this.emit("recorded", log, data);
  }

  // ---- Configuration & queries ----

  /** Sets the language used by the next recording. */
  setLanguage(language: string | undefined): void {
    this.language = language;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  isTranscriptionSupported(): boolean {
    return this.transcriber?.capabilities().live ?? false;
  }

  getLogs(query?: LogQuery): Promise<Log[]> {
    return this.storage?.getLogs(query) ?? Promise.resolve([]);
  }

  getLog(logId: LogId): Promise<Log | undefined> {
    return this.storage?.get(logId) ?? Promise.resolve(undefined);
  }

  getLogData(logId: LogId): Promise<LogData | undefined> {
    return this.storage?.getLogData(logId) ?? Promise.resolve(undefined);
  }

  async deleteLog(logId: LogId): Promise<void> {
    if (this.storage === undefined) {
      return;
    }
    await this.storage.delete(logId);
  }

  async renameLog(logId: LogId, title: string): Promise<Log | undefined> {
    const log = await this.getLog(logId);
    if (log === undefined || this.storage === undefined) {
      return undefined;
    }
    const renamed: Log = { ...log, title };
    await this.storage.updateMetadata(renamed);
    return renamed;
  }

  dispose(): void {
    this.endSession();
    this.stopTimer();
    this.recorder.dispose();
    void this.storage?.dispose().catch(() => undefined);
  }

  // ---- Log building ----

  private buildLog(
    recording: Recording,
    durationMs: number,
    transcript: string,
    language: string | undefined,
    title: string | undefined,
  ): { log: Log; data: LogData } {
    const logId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const log: Log = {
      id: logId,
      title,
      createdAt,
      durationMs,
      audio: {
        id: crypto.randomUUID(),
        mimeType: recording.blob.type,
        size: recording.blob.size,
        createdAt,
      },
      transcriptions:
        this.transcriber === undefined
          ? []
          : [
              {
                id: crypto.randomUUID(),
                logId,
                providerId: this.transcriber.id,
                language,
                createdAt,
                text: transcript,
              },
            ],
    };
    // The audio travels beside the metadata — to storage and to the UI.
    const data: LogData = { logId, audio: recording.blob };
    return { log, data };
  }
}