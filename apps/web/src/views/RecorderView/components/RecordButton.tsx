import { Mic } from "lucide-react";
import { Button } from "@/components/Button";

interface RecordButtonProps {
  supported: boolean;
  onToggle: () => void;
}

export function RecordButton({ supported, onToggle }: RecordButtonProps) {
  return (
    <Button
      type="button"
      aria-label="Start recording"
      disabled={!supported}
      onClick={onToggle}
      variant="default"
      size="icon"
      className="size-[120px]"
    >
      <Mic aria-hidden className="size-10" />
    </Button>
  );
}
