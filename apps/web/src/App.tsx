import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelect } from "@/components/LanguageSelect";
import { RecorderControls } from "@/components/RecorderControls";
import { StopButton } from "@/components/StopButton";
import { Transcript } from "@/components/Transcript";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { defaultLanguage } from "@/lib/languages";

export default function App() {
  const {
    recording: recordingSrc,
    seconds,
    status,
    start: startRecording,
    stop: stopRecording,
    discardRecording,
    pause: pauseRecording,
    resume: resumeRecording,
  } = useRecorder();
  const {
    transcript,
    partial,
    supported,
    start: startTranscription,
    stop: stopTranscription,
    resume: resumeTranscription,
    newParagraph,
  } = useTranscription();
  const [language, setLanguage] = useState(defaultLanguage());

  const recording = status !== "idle";
  const paused = status === "paused";

  const start = async () => {
    await startRecording();
    try {
      await startTranscription({ language });
    } catch (error) {
      stopRecording();
      throw error;
    }
  };

  // Stop ends everything at once — recorder and transcription — and leaves the
  // readonly state behind (playback of what was captured).
  const handleStop = () => {
    stopTranscription();
    stopRecording();
  };

  const handleTogglePause = () => {
    if (paused) {
      // Resume transcription first; if it fails, the recorder stays paused and
      // the user can retry or press stop.
      void resumeTranscription()
        .then(() => resumeRecording())
        .catch(() => undefined);
    } else {
      pauseRecording();
      stopTranscription();
      // Pausing starts a new paragraph: resumed speech lands on a fresh line.
      newParagraph();
    }
  };

  // An empty transcript means nothing was actually recorded: treat the
  // recording as failed, keep nothing, and stay in the initial state.
  useEffect(() => {
    if (recordingSrc !== null && transcript === "") {
      discardRecording();
    }
  }, [recordingSrc, transcript, discardRecording]);

  return (
    <AppShell
      header={
        <>
          <LanguageSelect
            disabled={recording}
            value={language}
            onChange={setLanguage}
          />
          {recording && <StopButton onStop={handleStop} />}
        </>
      }
    >
      <RecorderControls
        recording={recording}
        paused={paused}
        supported={supported}
        timerSeconds={seconds}
        playbackSrc={recordingSrc}
        onToggleRecord={() => void start()}
        onTogglePause={handleTogglePause}
      />
      <Transcript autoScroll={recording} transcript={transcript} partial={partial} />
    </AppShell>
  );
}