import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-slate-400",
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