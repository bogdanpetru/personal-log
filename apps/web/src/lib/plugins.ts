import { NativeSpeechPlugin } from "@personal-log/plugin-transcription-native";
import type { LiveTranscriptionPlugin } from "@personal-log/plugin-api";

export const transcriptionPlugins: LiveTranscriptionPlugin[] = [
  new NativeSpeechPlugin(),
];

export const defaultTranscriptionPlugin: LiveTranscriptionPlugin =
  transcriptionPlugins[0];
