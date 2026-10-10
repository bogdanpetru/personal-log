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
  // the pause/resume pill take its place. The stop button lives at the top
  // right of the screen, outside this column.
  if (recording) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Timer seconds={timerSeconds} />
        <PauseResumeButton paused={paused} onToggle={onTogglePause} />
      </div>
    );
  }
  // Initial and readonly states: the red record button is back; below it, the
  // playback row appears once a recording was kept.
  return (
    <div className="flex flex-col items-center gap-4">
      <RecordButton supported={supported} onToggle={onToggleRecord} />
      {playbackSrc !== null && (
        <Playback key={playbackSrc} src={playbackSrc} />
      )}
    </div>
  );
}