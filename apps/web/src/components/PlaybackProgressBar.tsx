interface PlaybackProgressBarProps {
  max: number;
  current: number;
}

export function PlaybackProgressBar({
  max,
  current,
}: PlaybackProgressBarProps) {
  const progress =
    max > 0 ? `${Math.min(100, (current / max) * 100)}%` : "0%";
  return (
    <div
      role="progressbar"
      aria-label="Playback progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(current)}
      className="h-1.5 w-40 overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: progress }}
      />
    </div>
  );
}