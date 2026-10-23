import type { ComponentProps } from "react";
import { cn } from "cn";

interface ListProps extends ComponentProps<"ul"> {}

export function List({ className, ...props }: ListProps) {
  return <ul data-slot="list" className={cn(className)} {...props} />;
}