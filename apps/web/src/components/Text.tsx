import type { ElementType, HTMLAttributes } from "react";
import { cn } from "cn";

const sizes = {
  xs: "text-caption font-light",
  sm: "text-caption font-light",
  base: "text-body font-light",
  title: "text-lead font-bold",
  display: "text-display font-light",
} as const;

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: keyof typeof sizes;
  muted?: boolean;
}

export function Text({
  as: Tag = "p",
  size = "base",
  muted = false,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(sizes[size], muted && "text-muted-foreground", className)}
      {...props}
    />
  );
}