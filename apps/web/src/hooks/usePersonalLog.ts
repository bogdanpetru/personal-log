import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PersonalLog } from "@personal-log/core";
import type { PersonalLogState } from "@personal-log/core";
import type { Log, LogId } from "@personal-log/plugin-api";
import { MediaRecorderRecorder } from "@personal-log/plugin-recorder-media";
import { OpfsStoragePlugin } from "@personal-log/plugin-storage-opfs";
import { NativeSpeechPlugin } from "@personal-log/plugin-transcription-native";

interface UsePersonalLog {
  core: PersonalLog;
  state: PersonalLogState;
  supported: boolean;
  playbackSrc: string | null;
  playbackAudio: Blob | null;
  finishedLog: Log | null;
  getAudioStream: () => MediaStream | null;
  logs: Log[];
  refreshLogs: () => Promise<Log[]>;
  loadLogData: (
    logId: LogId,
  ) => Promise<{ log: Log; audio: Blob; url: string } | undefined>;
  deleteLog: (logId: LogId) => Promise<void>;
}

const recorder = new MediaRecorderRecorder();
const core = new PersonalLog({
  recorder,
  transcriber: new NativeSpeechPlugin(),
  storage: new OpfsStoragePlugin(),
});

export function usePersonalLog(): UsePersonalLog {
  const getAudioStream = useCallback(() => recorder.getStream(), []);

  const subscribe = useCallback(
    (onStoreChange: () => void) => core.on("state", onStoreChange),
    [],
  );
  const getSnapshot = useCallback(() => core.getState(), []);
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const [playbackSrc, setPlaybackSrc] = useState<string | null>(null);
  const [playbackAudio, setPlaybackAudio] = useState<Blob | null>(null);
  const [finishedLog, setFinishedLog] = useState<Log | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  const refreshLogs = useCallback(async () => {
    const next = await core.getLogs();
    setLogs(next);
    return next;
  }, []);

  const loadLogData = useCallback(
    async (logId: LogId) => {
      const log = await core.getLog(logId);
      const data = await core.getLogData(logId);
      if (log === undefined || data === undefined) {
        return undefined;
      }
      setFinishedLog(log);
      const url = URL.createObjectURL(data.audio);
      setPlaybackAudio(data.audio);
      setPlaybackSrc((prev) => {
        if (prev !== null) {
          URL.revokeObjectURL(prev);
        }
        return url;
      });
      return { log, audio: data.audio, url };
    },
    [],
  );

  const deleteLog = useCallback(async (logId: LogId) => {
    await core.deleteLog(logId);
    setLogs((prev) => prev.filter((log) => log.id !== logId));
  }, []);

  useEffect(() => {
    let url: string | null = null;
    const show = (blob: Blob) => {
      url = URL.createObjectURL(blob);
      setPlaybackAudio(blob);
      setPlaybackSrc(url);
    };
    const hide = () => {
      if (url !== null) {
        URL.revokeObjectURL(url);
      }
      url = null;
      setPlaybackAudio(null);
      setPlaybackSrc(null);
    };
    const offRecorded = core.on("recorded", (log, data) => {
      setFinishedLog(log);
      show(data.audio);
    });
    const offDiscarded = core.on("discarded", () => {
      setFinishedLog(null);
      hide();
    });
    const offState = core.on("state", (next) => {
      if (next.status === "recording") {
        setFinishedLog(null);
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
  }, []);

  return {
    core,
    state,
    supported: core.isTranscriptionSupported(),
    playbackSrc,
    playbackAudio,
    finishedLog,
    getAudioStream,
    logs,
    refreshLogs,
    loadLogData,
    deleteLog,
  };
}
