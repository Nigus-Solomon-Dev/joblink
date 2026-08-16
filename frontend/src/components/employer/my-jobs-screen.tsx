"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Eye, MailCheck, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge, Button, EmptyState, ErrorState, Modal, Pagination, Skeleton } from "@/components/ui";
import { CompanyLogo } from "@/components/companies/company-logo";
import { myJobStatusOptions, useArchiveJob, useCloseJob, useDeleteJob, useMyJobs, usePublishJob } from "@/hooks/use-jobs";
import { cn } from "@/lib/cn";
import { jobStatusLabels, timeAgo } from "@/lib/format";
import type { JobStatus } from "@/types";

const STATUS_TABS = myJobStatusOptions;

export function MyJobsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>("published");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const jobs = useMyJobs({ status, page: page, limit: 10 });
  const publish = usePublishJob();
  const close = useCloseJob();
  const archive = useArchiveJob();
  const remove = useDeleteJob();

  const rows = jobs.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Employer</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">My jobs</h1>
          <p className="mt-1 text-sm text-slate-600">Create, edit, publish and keep track of your openings.</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button>
            <Plus className="size-4" />
            Post a new job
          </Button>
        </Link>
      </header>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 shadow-card">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              status === tab.value
                ? "bg-primary-600 text-white"
                : "text-slate-600 hover:bg-surface-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
        {jobs.isError ? (
          <div className="p-10">
            <ErrorState
              title="Couldn't load your jobs"
              message={
                jobs.error instanceof Error
                  ? jobs.error.message
                  : "Something went wrong while fetching your jobs."
              }
              onRetry={() => jobs.refetch()}
            />
          </div>
        ) : jobs.isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title={status === "published" ? "No published jobs yet" : `No ${jobStatusLabels[status].toLowerCase()} jobs`}
              description={
                status === "published"
                  ? "Your live openings will show up here."
                  : "Jobs you move into this state will show up here."
              }
              actionLabel="Post a job"
              onAction={() => router.push("/employer/jobs/new")}
            />
          </div>
        ) : (
          rows.map((job) => (
          <div key={job._id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
            <CompanyLogo name={job.companyId?.name} logo={job.companyId?.logo} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
                <Badge variant={statusVariantFor(job.status)} size="sm">{jobStatusLabels[job.status]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {job.location || "Location not set"} · posted {timeAgo(job.publishedAt || job.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span title="Views">{job.viewsCount ?? 0} views</span>
              <span title="Applications">{job.applicationsCount ?? 0} apps</span>
              <span title="Saves">{job.savesCount ?? 0} saves</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {job.status === "published" && (
                <Link href={`/jobs/${job._id}`} aria-label="View public listing">
                  <Button variant="ghost" size="sm"><Eye className="size-4" /></Button>
                </Link>
              )}
              {job.status === "published" && (
                <Link href="/employer/applicants">
                  <Button variant="ghost" size="sm"><MailCheck className="size-4" /><span className="sr-only">Applicants</span></Button>
                </Link>
              )}
              {job.status !== "archived" && (
                <Link href={`/employer/jobs/${job._id}/edit`} aria-label="Edit job">
                  <Button variant="ghost" size="sm"><Pencil className="size-4" /></Button>
                </Link>
              )}
              {job.status === "draft" && (
                <Button variant="outline" size="sm" loading={publish.isPending && publish.variables === job._id} onClick={() => publish.mutate(job._id)}>
                  Publish
                </Button>
              )}
              {job.status === "published" && (
                <Button variant="outline" size="sm" loading={close.isPending && close.variables === job._id} onClick={() => close.mutate(job._id)}>
                  Close
                </Button>
              )}
              {job.status !== "archived" && job.status !== "expired" && (
                <Button variant="ghost" size="sm" aria-label="Archive job" loading={archive.isPending && archive.variables === job._id} onClick={() => archive.mutate(job._id)}>
                  <Archive className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" aria-label="Delete job" onClick={() => setDeleteTarget(job._id)}>
                <Trash2 className="size-4 text-danger-600" />
              </Button>
            </div>
          </div>
          ))
        )}
      </div>

      <Pagination
        page={page}
        totalPages={jobs.data?.meta.totalPages ?? 1}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this job?"
        description="This permanently removes the job and its applications. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => {
                if (deleteTarget) {
                  remove.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
                }
              }}
            >
              Delete job
            </Button>
          </>
        }
      />
    </div>
  );
}

function statusVariantFor(status: JobStatus): "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline" {
  switch (status) {
    case "published": return "success";
    case "draft": return "neutral";
    case "closed": return "warning";
    case "expired": return "danger";
    case "archived": return "outline";
  }
}