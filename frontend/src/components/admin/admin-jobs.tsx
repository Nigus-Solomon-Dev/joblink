"use client";

import { useState } from "react";
import { Search, Star, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
} from "@/components/ui";
import {
  useAdminJobs,
  useDeleteAdminJob,
  useFeatureAdminJob,
} from "@/hooks/use-admin";
import { cn } from "@/lib/cn";
import { formatSalary, jobStatusLabels, jobTypeLabels, timeAgo } from "@/lib/format";
import type { AdminJobItem } from "@/types";

function statusVariant(status: AdminJobItem["status"]) {
  switch (status) {
    case "published":
      return "success" as const;
    case "closed":
      return "neutral" as const;
    case "archived":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export function AdminJobsScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [featured, setFeatured] = useState<string>("");
  const [deleting, setDeleting] = useState<AdminJobItem | null>(null);

  const jobsQuery = useAdminJobs({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    featured: featured === "" ? undefined : featured === "true",
  });
  const feature = useFeatureAdminJob();
  const remove = useDeleteAdminJob();

  const totalPages = jobsQuery.data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Jobs
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Job management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Feature, moderate, and remove listings across the platform.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setSearch(searchInput.trim());
            }}
            placeholder="Search job titles…"
            className="pl-9"
            aria-label="Search jobs by title"
          />
        </div>
        <Button variant="secondary" onClick={() => setSearch(searchInput.trim())}>Search</Button>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(jobStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <Select value={featured} onChange={(event) => { setFeatured(event.target.value); setPage(1); }} className="w-44" aria-label="Filter by featured status">
          <option value="">All featured</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Job</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Salary</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobsQuery.isError && (
                <tr>
                  <td colSpan={7} className="p-4">
                    <ErrorState
                      title="Couldn't load jobs"
                      message="Something went wrong while fetching jobs."
                      onRetry={() => jobsQuery.refetch()}
                    />
                  </td>
                </tr>
              )}

              {!jobsQuery.isError && jobsQuery.isPending &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-52" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))}

              {!jobsQuery.isError && !jobsQuery.isPending && (jobsQuery.data?.data ?? []).map((job) => {
                const company = typeof job.companyId === "object" && job.companyId ? job.companyId.name : undefined;
                return (
                  <tr key={job._id} className="hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {job.featured && <Star className="size-4 shrink-0 fill-warning-400 text-warning-500" />}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{job.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {job.applicationsCount ?? 0} applications · {job.viewsCount ?? 0} views
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{company ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{jobTypeLabels[job.type] ?? job.type}</td>
                    <td className="px-4 py-3 text-slate-600">{formatSalary(job)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(job.status)} dot>{jobStatusLabels[job.status] ?? job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{timeAgo(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => feature.mutate({ id: job._id, featured: !job.featured })}
                          className={cn(job.featured && "text-warning-600")}
                        >
                          <Star className="size-4" />
                          {job.featured ? "Unfeature" : "Feature"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(job)} aria-label={`Delete ${job.title}`}>
                          <Trash2 className="size-4 text-danger-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!jobsQuery.isError && !jobsQuery.isPending && (jobsQuery.data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No jobs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete job"
        description={deleting ? `${deleting.title} will be permanently removed.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => {
                if (deleting) remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Applicants will keep their history, but the listing disappears.</p>
      </Modal>
    </div>
  );
}