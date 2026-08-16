import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export function JobCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="size-10 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function JobCardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  );
}