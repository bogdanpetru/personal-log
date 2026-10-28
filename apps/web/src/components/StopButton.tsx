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
      className="h-10 cursor-pointer rounded-full border border-transparent bg-record px-4 text-white transition-colors hover:bg-record-hover"
    >
      <Square aria-hidden />
    </Button>
  );
}