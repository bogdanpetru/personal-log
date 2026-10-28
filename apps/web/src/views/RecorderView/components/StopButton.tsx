import { Square } from "lucide-react";
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
      variant="destructive"
      size="icon-lg"
      className="size-12"
    >
      <Square aria-hidden className="size-5" />
    </Button>
  );
}
