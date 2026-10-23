import { Button } from "@/components/Button";

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  return (
    <Button
      type="button"
      aria-label="Stop recording"
      onClick={onStop}
      className="h-10 cursor-pointer rounded-[3px] border border-border bg-transparent px-4 text-foreground font-normal transition-colors hover:bg-muted"
    >
      Stop
    </Button>
  );
}