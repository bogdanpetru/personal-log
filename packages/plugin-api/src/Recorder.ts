import type { Recording } from "./Recording.js";

/**
 * An audio source. Implementations wrap a capture mechanism (the default is
 * the browser's MediaRecorder) and hand the captured audio back on stop.
 */
export interface Recorder {
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): Promise<Recording>;
  dispose(): void;
}