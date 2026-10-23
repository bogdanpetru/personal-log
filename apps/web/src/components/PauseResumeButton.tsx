import { Pause as PauseIcon, Play } from "lucide-react";
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
      className="h-s4 cursor-pointer rounded-full border border-border bg-transparent px-s3 text-foreground transition-colors hover:bg-muted"
    >
      {paused ? <Play aria-hidden /> : <PauseIcon aria-hidden />}
    </Button>
  );
}