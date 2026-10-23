import { Disc3 } from "lucide-react";

export function RecordingIndicator() {
  return (
    <Disc3
      aria-hidden
      className="size-s4 animate-[spin_2.4s_linear_infinite] text-record"
    />
  );
}