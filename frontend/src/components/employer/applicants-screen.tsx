"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Eye, FileText, MailPlus, RotateCcw, X } from "lucide-react";

import { Button, EmptyState, ErrorState, FormField, Input, Modal, Pagination, Select, Skeleton, Textarea } from "@/components/ui";
import { ApplicationStatusBadge } from "@/components/seeker/application-status-badge";
import {
  useBulkUpdateApplicationStatus,
  useMakeOffer,
  useScheduleInterview,
  useUpdateApplicationStatus,
} from "@/hooks/use-applications";
import { useEmployerApplications } from "@/hooks/use-employer-dashboard";
import { useAllMyJobs } from "@/hooks/use-jobs";
import {
  applicationStatusLabels,
  formatDate,
  interviewTypeLabels,
  timeAgo,
} from "@/lib/format";
import type { ApplicationStatus, EmployerApplicationListItem } from "@/types";

const ALL_STATUSES: ApplicationStatus[] = [
  "pending",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];

function applicantInfo(application: EmployerApplicationListItem) {
  const applicant = typeof application.applicantId === "object" && application.applicantId ? application.applicantId : null;
  const job = typeof application.jobId === "object" && application.jobId ? application.jobId : null;
  return { applicant, job };
}

function initialsOf(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function StatusModal({
  application,
  onClose,
}: {
  application: EmployerApplicationListItem | null;
  onClose: () => void;
}) {
  const updateStatus = useUpdateApplicationStatus();
  const [status, setStatus] = useState<ApplicationStatus>("pending");
  const [notes, setNotes] = useState("");

  if (!application) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Change application status"
      description={applicantInfo(application).applicant?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { applicationId: application._id, status, notes: notes || undefined },
                { onSuccess: onClose },
              )
            }
          >
            Update status
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <FormField label="New status" htmlFor="app-status">
          <Select id="app-status" value={status} onChange={(event) => setStatus(event.target.value as ApplicationStatus)}>
            {ALL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {applicationStatusLabels[value]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Note for the applicant" htmlFor="app-notes" hint="Shown in their application timeline.">
          <Textarea id="app-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

const INTERVIEW_TYPES = ["video", "phone", "in_person"] as const;

function InterviewModal({
  application,
  onClose,
}: {
  application: EmployerApplicationListItem | null;
  onClose: () => void;
}) {
  const schedule = useScheduleInterview();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<(typeof INTERVIEW_TYPES)[number]>("video");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");

  if (!application) return null;

  const submit = () => {
    if (!date) return;
    schedule.mutate(
      {
        applicationId: application._id,
        details: {
          date,
          time: time || undefined,
          type,
          location: location || undefined,
          meetingLink: meetingLink || undefined,
          notes: notes || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule interview"
      description={`${applicantInfo(application).applicant?.name} · ${applicantInfo(application).job?.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={schedule.isPending} onClick={submit} disabled={!date}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date" htmlFor="interview-date" required>
          <Input id="interview-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </FormField>
        <FormField label="Time" htmlFor="interview-time">
          <Input id="interview-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="interview-type">
          <Select id="interview-type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="sm:col-span-2">
            {INTERVIEW_TYPES.map((option) => (
              <option key={option} value={option}>
                {interviewTypeLabels[option]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Location" htmlFor="interview-location" hint="Address or office, if in person.">
          <Input id="interview-location" value={location} onChange={(event) => setLocation(event.target.value)} />
        </FormField>
        <FormField label="Meeting link" htmlFor="interview-link" hint="For phone/video interviews.">
          <Input id="interview-link" type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} />
        </FormField>
        <FormField label="Notes" htmlFor="interview-notes" className="sm:col-span-2">
          <Textarea id="interview-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

function OfferModal({
  application,
  onClose,
}: {
  application: EmployerApplicationListItem | null;
  onClose: () => void;
}) {
  const offer = useMakeOffer();
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [startDate, setStartDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [notes, setNotes] = useState("");

  if (!application) return null;

  const valid = salary.trim() !== "" && startDate !== "";
  const submit = () => {
    if (!valid) return;
    offer.mutate(
      {
        applicationId: application._id,
        details: {
          salary: Number(salary),
          currency: currency || undefined,
          startDate,
          benefits: benefits || undefined,
          notes: notes || undefined,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Make an offer"
      description={`${applicantInfo(application).applicant?.name} · ${applicantInfo(application).job?.title}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={offer.isPending} onClick={submit} disabled={!valid}>
            Send offer
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Salary" htmlFor="offer-salary" required>
          <Input id="offer-salary" inputMode="numeric" placeholder="e.g. 25000" value={salary} onChange={(event) => setSalary(event.target.value)} />
        </FormField>
        <FormField label="Currency" htmlFor="offer-currency">
          <Input id="offer-currency" maxLength={3} placeholder="ETB" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
        </FormField>
        <FormField label="Start date" htmlFor="offer-start" required className="sm:col-span-2">
          <Input id="offer-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </FormField>
        <FormField label="Benefits" htmlFor="offer-benefits" className="sm:col-span-2">
          <Textarea id="offer-benefits" rows={2} value={benefits} onChange={(event) => setBenefits(event.target.value)} />
        </FormField>
        <FormField label="Note to applicant" htmlFor="offer-notes" className="sm:col-span-2">
          <Textarea id="offer-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

function DetailsModal({
  application,
  onClose,
}: {
  application: EmployerApplicationListItem | null;
  onClose: () => void;
}) {
  if (!application) return null;

  const { applicant, job } = applicantInfo(application);
  const history = application.statusHistory ?? [];

  return (
    <Modal open onClose={onClose} title="Application details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
            {initialsOf(applicant?.name ?? "Applicant")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{applicant?.name ?? "Applicant"}</p>
            <p className="truncate text-xs text-slate-500">{applicant?.email}</p>
            {(applicant?.location || applicant?.phone) && (
              <p className="truncate text-xs text-slate-500">
                {[applicant?.location, applicant?.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="ml-auto">
            <ApplicationStatusBadge status={application.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs text-slate-500">Applied to</p>
            <p className="mt-0.5 font-medium text-foreground">{job?.title ?? "—"}</p>
            <p className="text-xs text-slate-500">{timeAgo(application.createdAt)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs text-slate-500">Expected salary</p>
            <p className="mt-0.5 font-medium text-foreground">
              {application.expectedSalary != null ? `${application.expectedSalary.toLocaleString()} ETB` : "Not shared"}
            </p>
            <p className="text-xs text-slate-500">
              {application.availabilityDate ? `Available ${formatDate(application.availabilityDate)}` : "Availability not set"}
            </p>
          </div>
        </div>

        {application.coverLetter && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Cover letter</p>
            <p className="whitespace-pre-wrap text-sm text-slate-600">{application.coverLetter}</p>
          </div>
        )}

        {application.interviewDetails && (
          <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interview</p>
            <p className="mt-1 text-foreground">
              {application.interviewDetails.date ? formatDate(application.interviewDetails.date) : ""}
              {application.interviewDetails.time ? ` at ${application.interviewDetails.time}` : ""}
              {application.interviewDetails.type ? ` · ${interviewTypeLabels[application.interviewDetails.type] ?? application.interviewDetails.type}` : ""}
            </p>
            {application.interviewDetails.location && <p className="text-slate-600">{application.interviewDetails.location}</p>}
            {application.interviewDetails.meetingLink && (
              <p className="truncate text-primary-700">{application.interviewDetails.meetingLink}</p>
            )}
          </div>
        )}

        {application.offerDetails && (
          <div className="rounded-lg border border-border bg-success-50/60 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-success-700">Offer</p>
            <p className="mt-1 font-medium text-foreground">
              {application.offerDetails.salary?.toLocaleString()} {application.offerDetails.currency ?? "ETB"}
              {application.offerDetails.startDate ? ` · starting ${formatDate(application.offerDetails.startDate)}` : ""}
            </p>
            {application.offerDetails.benefits && <p className="text-slate-600">{application.offerDetails.benefits}</p>}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</p>
            <ol className="space-y-2 border-l border-border pl-4">
              {[...history].reverse().map((entry, index) => (
                <li key={`${entry.changedAt}-${index}`} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-surface bg-primary-500" />
                  <p className="font-medium text-foreground">{applicationStatusLabels[entry.status] ?? entry.status}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(entry.changedAt)}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function ApplicantsScreen() {
  const myJobs = useAllMyJobs();
  const [jobId, setJobId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [statusTarget, setStatusTarget] = useState<EmployerApplicationListItem | null>(null);
  const [interviewTarget, setInterviewTarget] = useState<EmployerApplicationListItem | null>(null);
  const [offerTarget, setOfferTarget] = useState<EmployerApplicationListItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<EmployerApplicationListItem | null>(null);

  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>("shortlisted");
  const [bulkMode, setBulkMode] = useState(false);

  const pipeline = useEmployerApplications({
    page,
    limit: 10,
    jobId: jobId || undefined,
    status: (statusFilter || undefined) as ApplicationStatus | undefined,
  });

  const bulk = useBulkUpdateApplicationStatus();
  const rows = pipeline.data?.data ?? [];

  const resetSelection = () => setSelected(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulk = () => {
    if (selected.size === 0) return;
    bulk.mutate(
      { applicationIds: [...selected], status: bulkStatus },
      {
        onSuccess: () => {
          resetSelection();
          setBulkMode(false);
        },
      },
    );
  };

  const actionsFor = useMemo(() => (application: EmployerApplicationListItem) => {
    const canInterview = ["under_review", "shortlisted"].includes(application.status);
    const canOffer = application.status === "interviewed";
    return { canInterview, canOffer };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Employer</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Applicants</h1>
          <p className="mt-1 text-sm text-slate-600">
            {pipeline.data?.meta.total ?? 0} total application{pipeline.data?.meta.total === 1 ? "" : "s"} across your jobs.
          </p>
        </div>
        {selected.size > 0 && !bulkMode && (
          <Button variant="outline" size="sm" onClick={() => setBulkMode(true)}>
            Bulk update ({selected.size})
          </Button>
        )}
        {bulkMode && (
          <Button variant="ghost" size="sm" onClick={() => { setBulkMode(false); resetSelection(); }}>
            <X className="size-4" />
            Cancel bulk
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
        <FormField label="Job" htmlFor="applicant-job" className="min-w-48 flex-1">
          <Select
            id="applicant-job"
            value={jobId}
            onChange={(event) => { setJobId(event.target.value); setPage(1); resetSelection(); }}
          >
            <option value="">All my jobs</option>
            {myJobs.data?.map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="applicant-status" className="min-w-40 flex-1">
          <Select
            id="applicant-status"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); resetSelection(); }}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((value) => (
              <option key={value} value={value}>{applicationStatusLabels[value]}</option>
            ))}
          </Select>
        </FormField>
        <Button variant="ghost" size="icon" aria-label="Reset filters" onClick={() => { setJobId(""); setStatusFilter(""); setPage(1); resetSelection(); }}>
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {bulkMode && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <FormField label={`Apply new status to ${selected.size} selected`} htmlFor="bulk-status" className="min-w-48 flex-1">
            <Select id="bulk-status" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as ApplicationStatus)}>
              {ALL_STATUSES.map((value) => (
                <option key={value} value={value}>{applicationStatusLabels[value]}</option>
              ))}
            </Select>
          </FormField>
          <Button variant="outline" onClick={() => { setBulkMode(false); resetSelection(); }}>
            Cancel
          </Button>
          <Button loading={bulk.isPending} onClick={applyBulk}>
            Update {selected.size} applications
          </Button>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
        {pipeline.isError ? (
          <div className="p-10">
            <ErrorState
              title="Couldn't load applicants"
              message={
                pipeline.error instanceof Error
                  ? pipeline.error.message
                  : "Something went wrong while fetching applicants."
              }
              onRetry={() => pipeline.refetch()}
            />
          </div>
        ) : pipeline.isPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No applicants match these filters"
              description="Try a different job or clear the status filter."
            />
          </div>
        ) : (
          rows.map((application) => {
          const { applicant, job } = applicantInfo(application);
          const { canInterview, canOffer } = actionsFor(application);
          return (
            <div key={application._id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
              {bulkMode && (
                <input
                  type="checkbox"
                  className="size-4 accent-[--color-primary-600]"
                  checked={selected.has(application._id)}
                  onChange={() => toggleSelect(application._id)}
                  aria-label={`Select ${applicant?.name ?? "applicant"}`}
                />
              )}
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                {initialsOf(applicant?.name ?? "Applicant")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{applicant?.name ?? "Applicant"}</p>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {applicant?.email} · {job?.title ?? "Job"} · applied {timeAgo(application.createdAt)}
                  {application.expectedSalary != null && ` · wants ${application.expectedSalary.toLocaleString()}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailTarget(application)}
                  aria-label="View details"
                >
                  <Eye className="size-4" />
                </Button>
                {canInterview && (
                  <Button variant="outline" size="sm" onClick={() => setInterviewTarget(application)}>
                    <CalendarPlus className="size-4" />
                    Interview
                  </Button>
                )}
                {canOffer && (
                  <Button variant="outline" size="sm" onClick={() => setOfferTarget(application)}>
                    <MailPlus className="size-4" />
                    Offer
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setStatusTarget(application)}>
                  <FileText className="size-4" />
                  Status
                </Button>
              </div>
            </div>
          );
        })
      )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {!bulkMode && selected.size > 0 ? (
          <p className="text-sm text-slate-500">{selected.size} selected</p>
        ) : <span />}
        <Pagination page={page} totalPages={pipeline.data?.meta.totalPages ?? 1} onPageChange={setPage} />
      </div>

      <StatusModal application={statusTarget} onClose={() => setStatusTarget(null)} />
      <InterviewModal application={interviewTarget} onClose={() => setInterviewTarget(null)} />
      <OfferModal application={offerTarget} onClose={() => setOfferTarget(null)} />
      <DetailsModal application={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  );
}