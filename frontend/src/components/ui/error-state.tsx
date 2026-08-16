import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-danger-100 bg-danger-50/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-surface text-danger-600 shadow-card">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {message && <p className="max-w-sm text-sm text-slate-600">{message}</p>}
      {children}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RotateCcw className="size-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}