"use client";

import { EmptyState, Skeleton } from "@/components/ui";
import { useMyJobById } from "@/hooks/use-jobs";
import { JobForm } from "@/components/employer/job-form";

export function EditJobScreen({ jobId }: { jobId: string }) {
  const { data: job, isLoading, isError } = useMyJobById(jobId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
        <EmptyState
          title="Job not found"
          description="This job may have been deleted, or you don't have access to it."
        />
      </div>
    );
  }

  return <JobForm mode="edit" job={job} />;
}