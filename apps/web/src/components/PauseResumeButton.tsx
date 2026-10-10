interface PauseResumeButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export function PauseResumeButton({
  paused,
  onToggle,
}: PauseResumeButtonProps) {
  return (
    <button
      type="button"
      aria-label={paused ? "Resume recording" : "Pause recording"}
      onClick={onToggle}
      className="h-10 cursor-pointer rounded-full border border-border px-4 text-sm transition-colors hover:bg-muted/50"
    >
      {paused ? "Resume" : "Pause"}
    </button>
  );
}