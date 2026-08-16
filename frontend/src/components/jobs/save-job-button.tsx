"use client";

import { Bookmark } from "lucide-react";

import { Button, Spinner } from "@/components/ui";
import { useSaveJobToggle } from "@/hooks/use-saved-job";
import { cn } from "@/lib/cn";

export interface SaveJobButtonProps {
  jobId: string;
  className?: string;
  withLabel?: boolean;
  fullWidth?: boolean;
}

export function SaveJobButton({
  jobId,
  className,
  withLabel = false,
  fullWidth = false,
}: SaveJobButtonProps) {
  const { isSaved, loading, toggling, toggle } = useSaveJobToggle(jobId);

  if (loading) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1.5 self-start",
          fullWidth && "w-full",
          className,
        )}
        aria-label="Checking saved status"
      >
        <Spinner className="size-4 text-slate-400" aria-label="Checking" />
        {withLabel && <span className="text-xs text-slate-400">Checking…</span>}
      </span>
    );
  }

  return (
    <Button
      variant={isSaved ? "outline" : "ghost"}
      size={withLabel ? "sm" : "icon"}
      onClick={toggle}
      disabled={toggling}
      fullWidth={fullWidth}
      aria-pressed={isSaved}
      aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
      title={isSaved ? "Remove from saved jobs" : "Save job"}
      className={cn(
        toggling && "opacity-60",
        isSaved && "text-accent-700",
        className,
      )}
    >
      {toggling ? (
        <Spinner className="size-4" aria-label="Saving" />
      ) : (
        <Bookmark className={cn("size-4", isSaved && "fill-current")} />
      )}
      {withLabel && <span>{isSaved ? "Saved" : "Save"}</span>}
    </Button>
  );
}