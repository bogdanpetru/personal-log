import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useRecorder } from "./useRecorder";

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

async function startHook() {
  installFakes();
  const { result } = renderHook(() => useRecorder());
  await act(async () => {
    await result.current.start();
  });
  const recorder = FakeMediaRecorder.instances.at(-1);
  if (recorder === undefined) {
    throw new Error("no MediaRecorder was constructed");
  }
  return { recorder, result };
}

test("starts and sets the recording status", async () => {
  const { result } = await startHook();
  expect(result.current.status).toBe("recording");
  expect(result.current.recording).toBeNull();
});

test("stop builds a playable blob URL from the captured chunks", async () => {
  const { recorder, result } = await startHook();
  act(() => {
    recorder.ondataavailable?.({ data: new Blob(["chunk"], { type: recorder.mimeType }) });
  });
  act(() => {
    result.current.stop();
  });
  expect(result.current.status).toBe("idle");
  act(() => {
    recorder.onstop?.();
  });
  expect(result.current.recording).not.toBeNull();

  act(() => {
    result.current.discardRecording();
  });
  expect(result.current.recording).toBeNull();
});

test("stop without captured chunks records nothing", async () => {
  const { recorder, result } = await startHook();
  act(() => {
    result.current.stop();
  });
  act(() => {
    recorder.onstop?.();
  });
  expect(result.current.recording).toBeNull();
});

test("pause and resume toggle the status once each way", async () => {
  const { recorder, result } = await startHook();
  act(() => {
    result.current.pause();
  });
  expect(result.current.status).toBe("paused");
  act(() => {
    result.current.resume();
  });
  expect(result.current.status).toBe("recording");
  expect(recorder.pause).toHaveBeenCalledTimes(1);
  expect(recorder.resume).toHaveBeenCalledTimes(1);
});

test("starting again discards the previous playback", async () => {
  const { recorder, result } = await startHook();
  act(() => {
    recorder.ondataavailable?.({ data: new Blob(["chunk"]) });
  });
  act(() => {
    result.current.stop();
  });
  act(() => {
    recorder.onstop?.();
  });
  expect(result.current.recording).not.toBeNull();

  await act(async () => {
    await result.current.start();
  });
  expect(result.current.recording).toBeNull();
});

test("the timer ticks while recording, freezes while paused, resets on restart", async () => {
  vi.useFakeTimers();
  try {
    const { result } = await startHook();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.seconds).toBe(1);

    // Paused: time passes but the clock does not.
    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(1);

    // Resume: only active recording time counts.
    act(() => {
      result.current.resume();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.seconds).toBe(3);

    // A new session rewinds the clock to zero.
    act(() => {
      result.current.stop();
    });
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.seconds).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});