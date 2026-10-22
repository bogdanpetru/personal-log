import type { Log, Recording } from "@personal-log/plugin-api";
import type { PersonalLogState } from "./PersonalLogState.js";

export interface PersonalLogEvents {
  /** Every state change: status, timer, transcript, partial. */
  state: (state: PersonalLogState) => void;
  /** Stop completed; the log was saved to storage. */
  recorded: (log: Log) => void;
  /** Stopping with an empty transcript: nothing was kept. */
  discarded: (recording: Recording) => void;
  /** A failure the caller may want to surface. */
  error: (error: unknown) => void;
}