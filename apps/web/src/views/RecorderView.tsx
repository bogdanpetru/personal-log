import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelect } from "@/components/LanguageSelect";
import { LanguageTag } from "@/components/LanguageTag";
import { PauseResumeButton } from "@/components/PauseResumeButton";
import { RecordButton } from "@/components/RecordButton";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { RecordingTitle } from "@/components/RecordingTitle";
import { StopButton } from "@/components/StopButton";
import { Timer } from "@/components/Timer";
import { Transcript } from "@/components/Transcript";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { PlaybackView } from "@/views/PlaybackView";
import { LANGUAGES, defaultLanguage } from "@/lib/languages";

export function RecorderView() {
  const { core, state, supported, playbackSrc, finishedLog } = usePersonalLog();
  const [language, setLanguage] = useState(defaultLanguage());
  const [title, setTitle] = useState("");

  useEffect(() => {
    core.setLanguage(language);
  }, [core, language]);

  const recording = state.status !== "idle";
  const paused = state.status === "paused";

  const start = () => {
    setTitle(
      new Date().toLocaleString("sv", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    void core.record().catch(() => undefined);
  };

  const handleStop = () => {
    void core.stop();
  };

  const handleTogglePause = () => {
    if (paused) {
      void core.resume();
    } else {
      core.pause();
    }
  };

  const playingBack = playbackSrc !== null;
  const viewLanguage =
    finishedLog?.transcriptions[0]?.language ?? language;
  const viewLanguageLabel =
    LANGUAGES.find((option) => option.code === viewLanguage)?.label ??
    viewLanguage;
  const transcript = recording
    ? state.transcript
    : playingBack
      ? (finishedLog?.transcriptions[0]?.text ?? "")
      : "";

  return (
    <AppShell>
      {recording ? (
        <div className="flex w-full flex-col items-center gap-s3">
          <div className="flex items-center gap-s2">
            <RecordingIndicator />
            <Timer seconds={state.seconds} />
          </div>
          <div className="flex items-center gap-s2">
            <PauseResumeButton paused={paused} onToggle={handleTogglePause} />
            <StopButton onStop={handleStop} />
          </div>
          <RecordingTitle title={title} onCommit={setTitle} />
          <LanguageTag label={viewLanguageLabel} />
        </div>
      ) : playingBack ? (
        <>
          <PlaybackView key={playbackSrc} src={playbackSrc} />
          <RecordingTitle title={title} onCommit={setTitle} />
          <LanguageTag label={viewLanguageLabel} />
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-s4">
          <RecordButton supported={supported} onToggle={start} />
          <LanguageSelect
            disabled={recording}
            value={language}
            onChange={setLanguage}
          />
        </div>
      )}
      <Transcript
        autoScroll={recording}
        transcript={transcript}
        partial={recording ? state.partial : ""}
      />
    </AppShell>
  );
}