import { CirclePause, CirclePlay } from "lucide-react";
import { Button } from "@/components/Button";

interface PlayButtonProps {
  playing: boolean;
  onToggle: () => void;
}

export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  return (
    <Button
      type="button"
      aria-label={playing ? "Pause playback" : "Play recording"}
      onClick={onToggle}
      variant="outline"
      size="icon"
      className="size-12"
    >
      {playing ? (
        <CirclePause aria-hidden className="size-6" />
      ) : (
        <CirclePlay aria-hidden className="size-6" />
      )}
    </Button>
  );
}
