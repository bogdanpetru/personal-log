import { describe, expect, it } from "vitest";
import { createWhisperProgressTracker } from "./WhisperDownloadProgress.js";

function progress(file: string, loaded: number, total: number) {
  return { status: "progress", name: "model", file, progress: (loaded / total) * 100, loaded, total } as const;
}

function ready() {
  return { status: "ready", task: "automatic-speech-recognition", model: "m" } as const;
}

describe("createWhisperProgressTracker", () => {
  it("aggregates bytes across files so the ratio only ever increases", () => {
    const ratios: number[] = [];
    const track = createWhisperProgressTracker(300, (ratio) => ratios.push(ratio));

    track(progress("config.json", 1, 1));
    track(progress("encoder.onnx", 100, 200));
    track(progress("encoder.onnx", 200, 200));
    track(progress("decoder.onnx", 50, 99));

    expect(ratios.every((ratio, index) => index === 0 || ratio > ratios[index - 1])).toBe(true);
    expect(ratios).toContain(1 / 300);
    expect(ratios).toContain(101 / 300);
    expect(ratios).toContain(201 / 300);
    expect(ratios).toContain(251 / 300);
  });

  it("caps the ratio at 0.99 until the pipeline is ready", () => {
    const ratios: number[] = [];
    const track = createWhisperProgressTracker(100, (ratio) => ratios.push(ratio));

    track(progress("encoder.onnx", 200, 200));

    expect(Math.max(...ratios)).toBe(0.99);

    track(ready());

    expect(ratios.at(-1)).toBe(1);
  });

  it("never emits a decrease when a new file's total becomes known", () => {
    const ratios: number[] = [];
    const track = createWhisperProgressTracker(4, (ratio) => ratios.push(ratio));

    track(progress("a.onnx", 2, 2));
    track(progress("b.onnx", 1, 2));
    track(progress("b.onnx", 2, 2));

    const decreases = ratios.filter((ratio, index) => index > 0 && ratio < ratios[index - 1]);
    expect(decreases).toEqual([]);
  });

  it("ignores progress events without a usable total", () => {
    const ratios: number[] = [];
    const track = createWhisperProgressTracker(100, (ratio) => ratios.push(ratio));

    track(progress("encoder.onnx", 50, 0));
    track(progress("encoder.onnx", 50, Number.NaN));

    expect(ratios).toEqual([]);
  });

  it("does nothing without an onProgress callback", () => {
    const track = createWhisperProgressTracker(100);

    expect(() => track(progress("a.onnx", 10, 10))).not.toThrow();
    expect(() => track(ready())).not.toThrow();
  });
});
