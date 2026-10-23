import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PersonalLog } from "@personal-log/core";
import type { PersonalLogState } from "@personal-log/core";
import { MediaRecorderRecorder } from "@personal-log/plugin-recorder-media";
import { OpfsStoragePlugin } from "@personal-log/plugin-storage-opfs";
import { NativeSpeechPlugin } from "@personal-log/plugin-transcription-native";

interface UsePersonalLog {
  core: PersonalLog;
  state: PersonalLogState;
  supported: boolean;
  playbackSrc: string | null;
}

export function usePersonalLog(): UsePersonalLog {
  const [core] = useState(
    () =>
      new PersonalLog({
        recorder: new MediaRecorderRecorder(),
        transcriber: new NativeSpeechPlugin(),
        storage: new OpfsStoragePlugin(),
      }),
  );

  const subscribe = useCallback(
    (onStoreChange: () => void) => core.on("state", onStoreChange),
    [core],
  );
  const getSnapshot = useCallback(() => core.getState(), [core]);
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const [playbackSrc, setPlaybackSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    const show = (blob: Blob) => {
      url = URL.createObjectURL(blob);
      setPlaybackSrc(url);
    };
    const hide = () => {
      if (url !== null) {
        URL.revokeObjectURL(url);
      }
      url = null;
      setPlaybackSrc(null);
    };
    const offRecorded = core.on("recorded", (_log, data) => show(data.audio));
    const offDiscarded = core.on("discarded", hide);
    const offState = core.on("state", (next) => {
      if (next.status === "recording") {
        hide();
      }
    });
    return () => {
      if (url !== null) {
        URL.revokeObjectURL(url);
      }
      offRecorded();
      offDiscarded();
      offState();
    };
  }, [core]);

  return {
    core,
    state,
    supported: core.isTranscriptionSupported(),
    playbackSrc,
  };
}