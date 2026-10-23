import type { ComponentProps } from "react";
import { cn } from "cn";

interface AudioProps extends ComponentProps<"audio"> {}

export function Audio({ className, ...props }: AudioProps) {
  return (
    <audio data-slot="audio" className={cn("hidden", className)} {...props} />
  );
}