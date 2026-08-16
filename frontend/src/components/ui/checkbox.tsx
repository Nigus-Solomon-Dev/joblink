import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, invalid, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <span className={cn("flex items-start gap-3", className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        aria-invalid={invalid || undefined}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden="true"
        className="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-border-strong bg-surface text-transparent transition-colors peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-600/40 peer-disabled:opacity-60"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {(label || description) && (
        <label htmlFor={inputId} className="cursor-pointer select-none">
          {label && <span className="block text-sm font-medium text-foreground">{label}</span>}
          {description && (
            <span className="block text-xs text-slate-500">{description}</span>
          )}
        </label>
      )}
    </span>
  );
});