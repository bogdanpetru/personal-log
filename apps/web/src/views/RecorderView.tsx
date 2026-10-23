import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelect } from "@/components/LanguageSelect";
import { PauseResumeButton } from "@/components/PauseResumeButton";
import { RecordButton } from "@/components/RecordButton";
import { StopButton } from "@/components/StopButton";
import { Timer } from "@/components/Timer";
import { Transcript } from "@/components/Transcript";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { PlaybackView } from "@/views/PlaybackView";
import { defaultLanguage } from "@/lib/languages";

export function RecorderView() {
  const { core, state, supported, playbackSrc } = usePersonalLog();
  const [language, setLanguage] = useState(defaultLanguage());

  useEffect(() => {
    core.setLanguage(language);
  }, [core, language]);

  const recording = state.status !== "idle";
  const paused = state.status === "paused";

  const start = () => {
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
      {recording ? (
        <div className="flex flex-col items-center gap-4">
          <Timer seconds={state.seconds} />
          <PauseResumeButton paused={paused} onToggle={handleTogglePause} />
        </div>
      ) : playbackSrc !== null ? (
        <PlaybackView key={playbackSrc} src={playbackSrc} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <RecordButton supported={supported} onToggle={start} />
        </div>
      )}
      <Transcript
        autoScroll={recording}
        transcript={state.transcript}
        partial={state.partial}
      />
    </AppShell>
  );
}