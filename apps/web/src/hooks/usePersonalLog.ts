import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PersonalLog } from "@personal-log/core";
import type { PersonalLogState } from "@personal-log/core";
import { MediaRecorderRecorder } from "@personal-log/plugin-recorder-media";
import { OpfsStoragePlugin } from "@personal-log/plugin-storage-opfs";
import { NativeSpeechPlugin } from "@personal-log/plugin-transcription-native";

interface UsePersonalLog {
  /** The headless core; commands go through it. */
  core: PersonalLog;
  state: PersonalLogState;
  supported: boolean;
  /** Object URL of the last completed recording, playable until discarded. */
  playbackSrc: string | null;
}

/**
 * App-side binding of the headless core: one PersonalLog instance, its state
 * exposed as a React store subscription, and the last recorded log turned
 * into a playback object URL. All UI logic stays in the components.
 */
export function usePersonalLog(): UsePersonalLog {
  // One core instance for the lifetime of the app (lazy state initializer —
  // it never gets replaced, only read). The plugins are composed here, at
  // the application level — the core itself defaults to nothing.
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

  // Completed logs become playable object URLs. The previous URL goes away
  // when a new recording session starts or the log is discarded (nothing was
  // recognized).
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