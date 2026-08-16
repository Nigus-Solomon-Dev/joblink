"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, MapPin, NotebookPen, Search, Trash2 } from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { useSavedJobs, useUnsaveJob, useUpdateSavedJobNote } from "@/hooks/use-saved-jobs";
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Textarea,
} from "@/components/ui";
import { formatSalary, jobTypeLabels } from "@/lib/format";
import type { JobListItem } from "@/types";

export function SavedJobsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [noteTarget, setNoteTarget] = useState<JobListItem | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const savedJobs = useSavedJobs({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });
  const unsave = useUnsaveJob();
  const updateNote = useUpdateSavedJobNote();

  const openNote = (job: JobListItem) => {
    setNoteTarget(job);
    setNoteDraft("");
  };

  const saveNote = () => {
    if (!noteTarget) return;
    updateNote.mutate(
      { jobId: noteTarget._id, notes: noteDraft.trim() },
      { onSuccess: () => setNoteTarget(null) },
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Saved jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Roles you&rsquo;re keeping an eye on. Add notes so you remember why.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search saved jobs…"
            className="pl-9"
            aria-label="Search saved jobs"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </header>

      {savedJobs.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-surface-sunken/60" />
          ))}
        </div>
      ) : savedJobs.isError ? (
        <ErrorState
          title="Couldn&rsquo;t load saved jobs"
          message={savedJobs.error instanceof Error ? savedJobs.error.message : undefined}
          onRetry={() => savedJobs.refetch()}
        />
      ) : (savedJobs.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title={debouncedSearch ? "No saved jobs match your search" : "No saved jobs yet"}
          description={
            debouncedSearch
              ? "Try a different search term."
              : "Hit the bookmark icon on any job to keep it here for later."
          }
          actionLabel={debouncedSearch ? "Clear search" : "Browse jobs"}
          onAction={() =>
            debouncedSearch ? setSearch("") : router.push("/jobs")
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
          {savedJobs.data?.data.map((job) => {
            const company = job.companyId;
            return (
              <li key={job._id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                <CompanyLogo name={company?.name} logo={company?.logo} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/jobs/${job._id}`}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary-700"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-primary-700">{company?.name ?? "Company"}</span>
                    <span>{jobTypeLabels[job.type]}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {job.location || "Location not specified"}
                    </span>
                    <span className="font-medium text-slate-600">{formatSalary(job)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openNote(job)}>
                    <NotebookPen className="size-4" />
                    Note
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={unsave.isPending}
                    onClick={() => unsave.mutate(job._id)}
                    aria-label={`Remove ${job.title} from saved jobs`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {savedJobs.data && savedJobs.data.meta.totalPages > 1 && (
        <Pagination
          className="mt-2"
          page={savedJobs.data.meta.page}
          totalPages={savedJobs.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={noteTarget !== null}
        onClose={() => setNoteTarget(null)}
        title="Add a note"
        description={noteTarget ? `About "${noteTarget.title}"` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setNoteTarget(null)}>
              Cancel
            </Button>
            <Button loading={updateNote.isPending} onClick={saveNote}>
              Save note
            </Button>
          </>
        }
      >
        <label htmlFor="saved-job-note" className="block text-sm font-medium text-foreground">
          Note
        </label>
        <Textarea
          id="saved-job-note"
          className="mt-2"
          rows={4}
          maxLength={500}
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Why are you keeping this one? Salary range, deadline, who to contact…"
        />
      </Modal>
    </div>
  );
}