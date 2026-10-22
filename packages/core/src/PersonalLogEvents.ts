import type { Log, LogData, Recording } from "@personal-log/plugin-api";
import type { PersonalLogState } from "./PersonalLogState.js";

export interface PersonalLogEvents {
  /** Every state change: status, timer, transcript, partial. */
  state: (state: PersonalLogState) => void;
  /**
   * Stop completed; the log was handed over (and saved, unless persistence
   * failed — a storage failure arrives as an "error" event). `data` carries
   * the audio so the UI can play the just-finished recording without a
   * re-fetch.
   */
  recorded: (log: Log, data: LogData) => void;
  /** Stopping with an empty transcript: nothing was kept. */
  discarded: (recording: Recording) => void;
  /** A failure the caller may want to surface. */
  error: (error: unknown) => void;
}