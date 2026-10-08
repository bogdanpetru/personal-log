import type { TranscriptionPlugin } from "./TranscriptionPlugin.js";
import type { LiveTranscriptionSession, TranscriptionOptions } from "./types.js";

export interface LiveTranscriptionPlugin extends TranscriptionPlugin {
  startLive(options?: TranscriptionOptions): Promise<LiveTranscriptionSession>;
}
