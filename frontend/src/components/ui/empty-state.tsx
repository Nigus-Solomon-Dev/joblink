import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-muted/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-surface text-slate-400 shadow-card">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}