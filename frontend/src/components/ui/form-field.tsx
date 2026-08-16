import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}