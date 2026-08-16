"use client";

import type { JobListItem } from "@/types";
import type { PaginationMeta } from "@/types/api";

import { JobCard } from "@/components/jobs/job-card";
import { JobCardListSkeleton } from "@/components/jobs/job-card-skeleton";
import { EmptyState, ErrorState, Pagination, Select } from "@/components/ui";
import { cn } from "@/lib/cn";

const sortOptions = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "salary_high", label: "Highest salary" },
  { value: "salary_low", label: "Lowest salary" },
  { value: "most_viewed", label: "Most viewed" },
];

export interface JobListProps {
  jobs: JobListItem[];
  meta?: PaginationMeta;
  page: number;
  sort: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onPageChange: (page: number) => void;
  onSortChange: (sort: string) => void;
  onRetry?: () => void;
  className?: string;
}

export function JobList({
  jobs,
  meta,
  page,
  sort,
  isLoading,
  isError,
  errorMessage,
  onPageChange,
  onSortChange,
  onRetry,
  className,
}: JobListProps) {
  const showContent = !isLoading || jobs.length > 0;
  const totalLabel =
    meta?.total !== undefined
      ? `${meta.total.toLocaleString()} ${meta.total === 1 ? "job" : "jobs"}`
      : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {showContent && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite">
            {totalLabel ??
              (isLoading ? "Searching jobs…" : `${jobs.length} job${jobs.length === 1 ? "" : "s"}`)}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Sort by
            <Select
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              className="w-44"
              aria-label="Sort jobs"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}

      {isError ? (
        <ErrorState
          title="Couldn't load jobs"
          message={errorMessage ?? "Something went wrong while fetching jobs."}
          onRetry={onRetry}
        />
      ) : isLoading && jobs.length === 0 ? (
        <JobCardListSkeleton count={6} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs match your filters"
          description="Try adjusting your keywords or clearing a filter to see more results."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          onPageChange={onPageChange}
          className="pt-2"
        />
      )}
    </div>
  );
}