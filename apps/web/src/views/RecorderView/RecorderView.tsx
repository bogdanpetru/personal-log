import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { LanguageSelector } from "@/views/components/LanguageSelector";
import { Transcript } from "@/views/components/Transcript";
import { PauseResumeButton } from "@/views/RecorderView/components/PauseResumeButton";
import { RecordButton } from "@/views/RecorderView/components/RecordButton";
import { RecordingTitle } from "@/views/RecorderView/components/RecordingTitle";
import { StopButton } from "@/views/RecorderView/components/StopButton";
import { Timer } from "@/views/RecorderView/components/Timer";
import { Waveform } from "@/views/RecorderView/components/Waveform";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { PlaybackView } from "@/views/PlaybackView";
import { LANGUAGES, defaultLanguage } from "@/lib/languages";

export function RecorderView() {
  const { core, state, supported, playbackSrc, finishedLog, getAudioStream } =
    usePersonalLog();
  const [language, setLanguage] = useState(defaultLanguage());
  const [title, setTitle] = useState("");
  const levels = useAudioLevel(state.status === "recording", getAudioStream);

  useEffect(() => {
    core.setLanguage(language);
  }, [core, language]);

  const header = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/records">
        <ArrowLeft aria-hidden className="size-4" />
        Back
      </Link>
    </Button>
  );

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
  const titleRow = (
    <div className="flex w-full items-center justify-between gap-5 self-start">
      <RecordingTitle title={title} onCommit={setTitle} />
      <Badge variant="secondary">{viewLanguageLabel}</Badge>
    </div>
  );

  return (
    <AppShell header={header}>
      {recording ? (
        <div className="flex w-full flex-col items-center gap-8 mb-6">
          <Waveform levels={levels} className="mb-4 h-20 w-full text-foreground" />
          <Timer seconds={state.seconds} />
          <div className="flex items-center gap-3">
            <PauseResumeButton paused={paused} onToggle={handleTogglePause} />
            <StopButton onStop={handleStop} />
          </div>
          {titleRow}
        </div>
      ) : playingBack ? (
        <>
          <PlaybackView key={playbackSrc} src={playbackSrc} />
          {titleRow}
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <RecordButton supported={supported} onToggle={start} />
          <LanguageSelector
            disabled={recording}
            value={language}
            onChange={setLanguage}
          />
        </div>
      )}
      {recording || playingBack ? (
        <Transcript
          autoScroll={recording}
          transcript={transcript}
          partial={recording ? state.partial : ""}
        />
      ) : null}
    </AppShell>
  );
}
