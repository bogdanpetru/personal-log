import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LanguageSelect } from "@/components/LanguageSelect";
import { RecorderControls } from "@/components/RecorderControls";
import { StopButton } from "@/components/StopButton";
import { Transcript } from "@/components/Transcript";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { defaultLanguage } from "@/lib/languages";

export default function App() {
  const { core, state, supported, playbackSrc } = usePersonalLog();
  const [language, setLanguage] = useState(defaultLanguage());

  // The language takes effect on the next recording (PL-4): the selector is
  // disabled while recording, so this only ever changes between sessions.
  useEffect(() => {
    core.setLanguage(language);
  }, [core, language]);

  const recording = state.status !== "idle";
  const paused = state.status === "paused";

  // Recording needs its transcription: a start failure (recorder or
  // recognizer) leaves the core idle and is surfaced by it; nothing to do here.
  const start = () => {
    void core.record().catch(() => undefined);
  };

  // Stop ends everything at once — recorder and transcription — and leaves
  // the completed log behind (playback of what was captured).
  const handleStop = () => {
    void core.stop();
  };

  const handleTogglePause = () => {
    if (paused) {
      // Resume transcription first; if it fails, the recorder stays paused and
      // the user can retry or press stop.
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
      <RecorderControls
        recording={recording}
        paused={paused}
        supported={supported}
        timerSeconds={state.seconds}
        playbackSrc={playbackSrc}
        onToggleRecord={start}
        onTogglePause={handleTogglePause}
      />
      <Transcript
        autoScroll={recording}
        transcript={state.transcript}
        partial={state.partial}
      />
    </AppShell>
  );
}