import type { ComponentProps } from "react";
import { cn } from "cn";

interface ListItemProps extends ComponentProps<"li"> {}

export function ListItem({ className, ...props }: ListItemProps) {
  return (
    <li data-slot="list-item" className={cn("text-sm", className)} {...props} />
  );
}