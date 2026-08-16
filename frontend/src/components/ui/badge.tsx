import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-primary-50 text-primary-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-600",
  outline: "border border-border-strong text-slate-600",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2 py-0.5 text-xs",
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: "bg-slate-400",
  primary: "bg-primary-600",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
  outline: "bg-slate-400",
};

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotColors[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}