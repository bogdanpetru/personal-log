import { PauseResumeButton } from "./PauseResumeButton";
import { Playback } from "./Playback";
import { RecordButton } from "./RecordButton";
import { Timer } from "./Timer";

interface RecorderControlsProps {
  recording: boolean;
  paused: boolean;
  supported: boolean;
  /** Elapsed active recording seconds while recording, frozen while paused. */
  timerSeconds: number;
  /** Object URL of the last completed recording, or null. */
  playbackSrc: string | null;
  onToggleRecord: () => void;
  onTogglePause: () => void;
}

export function RecorderControls({
  recording,
  paused,
  supported,
  timerSeconds,
  playbackSrc,
  onToggleRecord,
  onTogglePause,
}: RecorderControlsProps) {
  // Recording state: the record button is gone entirely — a ticking timer and
  // the pause/resume pill take its place below the header.
  if (recording) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Timer seconds={timerSeconds} />
        <PauseResumeButton paused={paused} onToggle={onTogglePause} />
      </div>
    );
  }
  // Readonly state: playback only — the record button is no longer visible
  // (Amendment 2).
  if (playbackSrc !== null) {
    return <Playback key={playbackSrc} src={playbackSrc} />;
  }
  // Initial state: the red record button, vertically centered in the space
  // below the header — the only state that ever centers.
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <RecordButton supported={supported} onToggle={onToggleRecord} />
    </div>
  );
}