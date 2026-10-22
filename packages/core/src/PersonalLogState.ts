/** The current session, observable through `getState()` and the "state" event. */
export interface PersonalLogState {
  status: "idle" | "recording" | "paused";
  /** Elapsed active recording time in whole seconds, paused time excluded. */
  seconds: number;
  /** Committed transcript text of the current session. */
  transcript: string;
  /** Ephemeral interim recognition text, not yet committed. */
  partial: string;
}