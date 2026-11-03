import { describe, expect, it, vi } from "vitest";
import {
  WHISPER_CHUNK_SECONDS,
  WHISPER_SAMPLE_RATE,
} from "./WhisperModel.js";
import { WhisperStreamSource } from "./WhisperStreamSource.js";

const CHUNK_SAMPLE_COUNT = WHISPER_SAMPLE_RATE * WHISPER_CHUNK_SECONDS;
const FRAME_SIZE = 128;

function iotaFrame(start: number, length: number): Float32Array {
  const frame = new Float32Array(length);
  for (let index = 0; index < length; index++) {
    frame[index] = start + index;
  }
  return frame;
}

function fakeStream(): MediaStream {
  return { tracks: [] } as unknown as MediaStream;
}

describe("WhisperStreamSource", () => {
  it("emits one exact chunk per CHUNK_SAMPLE_COUNT samples, in order", () => {
    const chunks: Float32Array[] = [];
    const source = new WhisperStreamSource(fakeStream(), (chunk) => {
      chunks.push(chunk);
    });
    const frames = CHUNK_SAMPLE_COUNT / FRAME_SIZE;
    for (let index = 0; index < frames; index++) {
      source.pushFrame(iotaFrame(index * FRAME_SIZE, FRAME_SIZE));
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0].length).toBe(CHUNK_SAMPLE_COUNT);
    const expected = new Float32Array(CHUNK_SAMPLE_COUNT);
    for (let index = 0; index < CHUNK_SAMPLE_COUNT; index++) {
      expected[index] = index;
    }
    expect(chunks[0]).toEqual(expected);
  });

  it("splits oversized frames across chunk boundaries", () => {
    const chunks: Float32Array[] = [];
    const source = new WhisperStreamSource(fakeStream(), (chunk) => {
      chunks.push(chunk);
    });
    const big = CHUNK_SAMPLE_COUNT * 2 + 500;
    source.pushFrame(iotaFrame(0, big));
    expect(chunks).toHaveLength(2);
    expect(chunks[0].length).toBe(CHUNK_SAMPLE_COUNT);
    let expected = 0;
    for (const chunk of chunks) {
      for (const sample of chunk) {
        expect(sample).toBe(expected);
        expected += 1;
      }
    }
  });

  it("retains the leftover samples until the next chunk completes", () => {
    const chunks: Float32Array[] = [];
    const source = new WhisperStreamSource(fakeStream(), (chunk) => {
      chunks.push(chunk);
    });
    source.pushFrame(iotaFrame(0, CHUNK_SAMPLE_COUNT + 10));
    expect(chunks).toHaveLength(1);
    const carried = Array.from({ length: 10 }, (_, index) =>
      CHUNK_SAMPLE_COUNT + index,
    );
    source.pushFrame(iotaFrame(CHUNK_SAMPLE_COUNT + 10, CHUNK_SAMPLE_COUNT - 10));
    expect(chunks).toHaveLength(2);
    expect(Array.from(chunks[1].slice(0, 10))).toEqual(carried);
  });

  it("touches neither AudioContext nor the stream until start()", () => {
    const onChunk = vi.fn();
    new WhisperStreamSource(fakeStream(), onChunk);
    expect(onChunk).not.toHaveBeenCalled();
  });
});
