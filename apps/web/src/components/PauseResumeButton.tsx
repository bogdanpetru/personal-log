import { Button } from "@/components/Button";

interface PauseResumeButtonProps {
  paused: boolean;
  onToggle: () => void;
}

export function PauseResumeButton({
  paused,
  onToggle,
}: PauseResumeButtonProps) {
  return (
    <Button
      type="button"
      aria-label={paused ? "Resume recording" : "Pause recording"}
      onClick={onToggle}
      className="h-10 cursor-pointer rounded-[3px] border border-border bg-transparent px-4 text-foreground font-normal transition-colors hover:bg-muted"
    >
      {paused ? "Resume" : "Pause"}
    </Button>
  );
}