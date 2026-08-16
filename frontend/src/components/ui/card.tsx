import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ className, hoverable, padding = "md", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-card",
        paddings[padding],
        hoverable &&
          "transition-shadow duration-200 hover:border-border-strong hover:shadow-popover",
        className,
      )}
      {...props}
    />
  );
}