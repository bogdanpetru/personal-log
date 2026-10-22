import type { LogId } from "./Log.js";

/** The heavy payload of a log: the audio itself, fetched on demand. */
export interface LogData {
  logId: LogId;
  audio: Blob;
}