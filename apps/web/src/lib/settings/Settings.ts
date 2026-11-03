import type { AudioFormatId } from "../audio/formats";
import type { Locale } from "../i18n/locales";
import type { TranscriptionEngine } from "../transcription/TranscriptionEngine";
import type { ThemeMode } from "../theme";

export interface Settings {
  language: string;
  downloadFormat: AudioFormatId;
  theme: ThemeMode;
  locale: Locale;
  transcriptionEngine: TranscriptionEngine;
}
