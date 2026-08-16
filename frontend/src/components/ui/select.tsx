import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <span className="relative block">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border bg-surface pl-3 pr-9 text-sm text-foreground",
          "transition-colors focus:outline-none focus:ring-2",
          invalid
            ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
            : "border-border-strong focus:border-primary-600 focus:ring-primary-600/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </span>
  );
});