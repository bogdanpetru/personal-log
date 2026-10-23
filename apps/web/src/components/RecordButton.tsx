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
      className="flex size-s6 cursor-pointer items-center justify-center rounded-full bg-record transition-colors hover:bg-record-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Mic aria-hidden className="size-s3 text-white" />
    </Button>
  );
}