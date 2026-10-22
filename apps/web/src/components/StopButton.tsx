interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <button
      type="button"
      aria-label="Stop recording"
      onClick={onStop}
      className="h-10 cursor-pointer rounded-[3px] border border-border px-4 text-sm transition-colors hover:bg-muted/50"
    >
      Stop
    </button>
  );
}