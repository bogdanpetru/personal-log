import { afterEach, expect, test, vi } from "vitest";
import { MediaRecorderRecorder } from "./MediaRecorderRecorder";

class FakeStream {
  getTracks() {
    return [{ stop: () => undefined }];
  }
}

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];

  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType = "audio/webm;codecs=opus";
  start = vi.fn();
  stop = vi.fn();
  pause = vi.fn();
  resume = vi.fn();

  constructor() {
    FakeMediaRecorder.instances.push(this);
  }
}

function installFakes(): void {
  FakeMediaRecorder.instances = [];
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn(async () => new FakeStream()) },
    configurable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "mediaDevices");
});

async function startRecorder() {
  installFakes();
  const recorder = new MediaRecorderRecorder();
  await recorder.start();
  const mediaRecorder = FakeMediaRecorder.instances.at(-1);
  if (mediaRecorder === undefined) {
    throw new Error("no MediaRecorder was constructed");
  }
  return { mediaRecorder, recorder };
}

test("start requests the microphone and begins capturing", async () => {
  const { mediaRecorder, recorder } = await startRecorder();
  expect(mediaRecorder.start).toHaveBeenCalledTimes(1);
  const stopPromise = recorder.stop();
  mediaRecorder.onstop?.();
  await stopPromise;
});

test("stop builds a blob from the captured chunks", async () => {
  const { mediaRecorder, recorder } = await startRecorder();
  mediaRecorder.ondataavailable?.({
    data: new Blob(["chunk"], { type: mediaRecorder.mimeType }),
  });
  const stopPromise = recorder.stop();
  mediaRecorder.onstop?.();
  const recording = await stopPromise;
  expect(recording.blob).not.toBeNull();
  expect(recording.blob.type).toBe(mediaRecorder.mimeType);
});

test("stop without captured chunks yields an empty recording", async () => {
  const { mediaRecorder, recorder } = await startRecorder();
  const stopPromise = recorder.stop();
  mediaRecorder.onstop?.();
  const recording = await stopPromise;
  expect(recording.blob.size).toBe(0);
});

test("pause and resume delegate to the MediaRecorder once each way", async () => {
  const { mediaRecorder, recorder } = await startRecorder();
  recorder.pause();
  recorder.resume();
  expect(mediaRecorder.pause).toHaveBeenCalledTimes(1);
  expect(mediaRecorder.resume).toHaveBeenCalledTimes(1);
  const stopPromise = recorder.stop();
  mediaRecorder.onstop?.();
  await stopPromise;
});

test("start failure (microphone denied) propagates", async () => {
  installFakes();
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn(async () => {
        throw new Error("denied");
      }),
    },
    configurable: true,
  });
  const recorder = new MediaRecorderRecorder();
  await expect(recorder.start()).rejects.toThrow("denied");
});