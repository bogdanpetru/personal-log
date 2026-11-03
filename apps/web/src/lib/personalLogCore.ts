import { PersonalLog } from "@personal-log/core";
import { MediaRecorderRecorder } from "@personal-log/plugin-recorder-media";
import { NativeSpeechPlugin } from "@personal-log/plugin-transcription-native";
import { logStorage } from "./logStorage";
import { TranscriptionEngineSelector } from "./transcription/TranscriptionEngineSelector";
import { whisperTranscriber } from "./transcription/whisperTranscriber";

export const personalLogRecorder = new MediaRecorderRecorder();

export const personalLogCore = new PersonalLog({
  recorder: personalLogRecorder,
  transcriber: new TranscriptionEngineSelector(
    new NativeSpeechPlugin(),
    whisperTranscriber,
  ),
  storage: logStorage,
});
