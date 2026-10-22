import { afterEach, describe, expect, it } from "vitest";
import { NativeSpeechPlugin } from "./NativeSpeechPlugin.js";
import { NativeSpeechUnsupportedError } from "./NativeSpeechUnsupportedError.js";
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

  // test helper: emit a recognition event. The first result lands at
  // resultIndex (default: the last result, the common Chrome event shape), the
  // rest follow at consecutive indices, and the list is long enough for the
  // plugin to read from resultIndex onward — like the engine's result list.
  emit(
    results: { isFinal: boolean; transcript: string }[],
    resultIndex = Math.max(0, results.length - 1),
  ) {
    const list = {
      length: resultIndex + results.length,
    } as SpeechRecognitionResultList;
    results.forEach((r, i) => {
      list[resultIndex + i] = {
        isFinal: r.isFinal,
        length: 1,
        0: { transcript: r.transcript, confidence: 1 },
        // TS 6's lib.dom ships SpeechRecognitionResult natively (with `item`
        // and `[Symbol.iterator]`); our ambient decl merges with it, so the
        // fake result is cast to satisfy the merged interface.
      } as unknown as SpeechRecognitionResult;
    });
    this.onresult?.({ resultIndex, results: list } as SpeechRecognitionEvent);
  }
}
// The inline object written as list[i] = { ... 0: {...} } matches the ambient
// SpeechRecognitionResult shape (index signature + isFinal/length fields).

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
    const plugin = new NativeSpeechPlugin();
    expect(plugin.capabilities()).toEqual({
      live: false,
      local: false,
      offline: false,
      languages: [],
    });
  });

  it("reports live capability when SpeechRecognition exists", () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    const caps = plugin.capabilities();
    expect(caps.live).toBe(true);
  });

  it("startLive throws NativeSpeechUnsupportedError when unsupported", async () => {
    removeFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    await expect(plugin.startLive()).rejects.toBeInstanceOf(
      NativeSpeechUnsupportedError,
    );
  });

  it("startLive configures continuous + interim recognition", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    await plugin.startLive();
    const speech = FakeSpeechRecognition.instances[0];
    expect(speech.continuous).toBe(true);
    expect(speech.interimResults).toBe(true);
    expect(speech.started).toBe(1);
  });

  it("emits partial and final results through the callbacks", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
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
    const plugin = new NativeSpeechPlugin();
    const session = await plugin.startLive();
    const finals: string[] = [];
    session.onFinalResult((t) => finals.push(t));
    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: true, transcript: "one two" }], 0);
    speech.emit([{ isFinal: true, transcript: "three" }], 1);

    expect(finals).toEqual(["one two", "one two three"]);

    const result = await session.stop();
    expect(result.text).toBe("one two three");
    expect(speech.stopped).toBe(1);
  });

  it("replaces a re-finalized result at its index instead of repeating it", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    const session = await plugin.startLive();
    const finals: string[] = [];
    session.onFinalResult((t) => finals.push(t));
    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: true, transcript: "hello world" }]);
    speech.emit([{ isFinal: true, transcript: "hello world today" }]);

    expect(finals).toEqual(["hello world", "hello world today"]);

    const result = await session.stop();
    expect(result.text).toBe("hello world today");
  });

  it("drops an identical re-finalization of a recorded final", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    const session = await plugin.startLive();
    const finals: string[] = [];
    session.onFinalResult((t) => finals.push(t));
    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: true, transcript: "hello" }]);
    speech.emit([{ isFinal: true, transcript: "hello" }]);

    expect(finals).toEqual(["hello"]);

    const result = await session.stop();
    expect(result.text).toBe("hello");
  });

  it("does not duplicate the committed tail when the engine restarts and re-delivers it", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    const session = await plugin.startLive();
    const finals: string[] = [];
    session.onFinalResult((t) => finals.push(t));
    const speech = FakeSpeechRecognition.instances[0];
    speech.emit([{ isFinal: true, transcript: "one two" }]);
    speech.onend?.(); // engine restarts on silence, tail is committed
    // Fresh run re-delivers the previous tail, then continues with new text.
    speech.emit([{ isFinal: true, transcript: "one two" }]);
    speech.emit([{ isFinal: true, transcript: "three" }], 1);

    expect(finals.some((text) => text === "one two one two three")).toBe(false);
    expect(finals.at(-1)).toBe("one two three");

    const result = await session.stop();
    expect(result.text).toBe("one two three");
    expect(finals.at(-1)).toBe("one two three");
  });

  it("restarts recognition on end while the session is active, not after stop", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    const session = await plugin.startLive();
    const speech = FakeSpeechRecognition.instances[0];
    expect(speech.started).toBe(1);

    speech.onend?.();
    expect(speech.started).toBe(2); // auto-restart while active

    await session.stop();
    speech.onend?.();
    expect(speech.started).toBe(2); // no restart after stop
  });

  it("honors a language option", async () => {
    installFakeSpeech();
    const plugin = new NativeSpeechPlugin();
    await plugin.startLive({ language: "de-DE" });
    expect(FakeSpeechRecognition.instances[0].lang).toBe("de-DE");
  });
});
