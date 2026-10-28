import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 32;
const SMOOTHING = 0.8;
const UPDATE_MS = 50;
const EMPTY_LEVELS = Array.from({ length: BAR_COUNT }, () => 0);

export function useAudioLevel(
  active: boolean,
  getStream: () => MediaStream | null,
): number[] {
  const [levels, setLevels] = useState<number[]>(EMPTY_LEVELS);
  const levelsRef = useRef<number[]>(EMPTY_LEVELS);

  useEffect(() => {
    if (!active) {
      levelsRef.current = EMPTY_LEVELS;
      return;
    }
    const stream = getStream();
    if (stream === null || typeof AudioContext === "undefined") {
      return;
    }

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let last = 0;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (time - last < UPDATE_MS) {
        return;
      }
      last = time;
      analyser.getByteTimeDomainData(data);
      const segmentSize = Math.floor(data.length / BAR_COUNT);
      const next = Array.from({ length: BAR_COUNT }, (_, index) => {
        const start = index * segmentSize;
        const end = index === BAR_COUNT - 1 ? data.length : start + segmentSize;
        let peak = 0;
        for (let sample = start; sample < end; sample += 1) {
          const amplitude = Math.abs(data[sample] - 128) / 128;
          if (amplitude > peak) {
            peak = amplitude;
          }
        }
        return Math.min(1, peak * 2.5);
      });
      const smoothed = next.map((value, index) => {
        const previous = levelsRef.current[index] ?? 0;
        return previous * SMOOTHING + value * (1 - SMOOTHING);
      });
      levelsRef.current = smoothed;
      setLevels(smoothed);
    };

    void context.resume().catch(() => undefined);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      analyser.disconnect();
      void context.close().catch(() => undefined);
    };
  }, [active, getStream]);

  return active ? levels : EMPTY_LEVELS;
}
