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
      className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-full bg-record transition-colors hover:bg-record-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Mic aria-hidden className="size-10 text-white" />
    </Button>
  );
}