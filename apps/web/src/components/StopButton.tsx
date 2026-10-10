interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <button
      type="button"
      aria-label="Stop recording"
      onClick={onStop}
      className="fixed right-4 top-4 z-10 h-10 cursor-pointer rounded-full border border-border px-4 text-sm transition-colors hover:bg-muted/50"
    >
      Stop
    </button>
  );
}