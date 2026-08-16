import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-lg border bg-surface px-3 text-sm text-foreground placeholder:text-slate-400",
        "transition-colors focus:outline-none focus:ring-2",
        invalid
          ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
          : "border-border-strong focus:border-primary-600 focus:ring-primary-600/20",
        className,
      )}
      {...props}
    />
  );
});