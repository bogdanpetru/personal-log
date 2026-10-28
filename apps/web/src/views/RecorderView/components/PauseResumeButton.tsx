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
      variant="outline"
      size="icon-lg"
      className="size-12"
    >
      {paused ? (
        <Play aria-hidden className="size-5" />
      ) : (
        <PauseIcon aria-hidden className="size-5" />
      )}
    </Button>
  );
}
