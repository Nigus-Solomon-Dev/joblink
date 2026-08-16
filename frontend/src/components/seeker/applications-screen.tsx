"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileText,
  Inbox,
  MapPin,
  ScrollText,
} from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { ApplicationStatusBadge } from "@/components/seeker/application-status-badge";
import { useApplicationTimeline } from "@/hooks/use-jobseeker-dashboard";
import {
  useAcceptOffer,
  useMyApplicationsPage,
  useWithdrawApplication,
} from "@/hooks/use-applications";
import {
  Button,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  Select,
  TabContent,
  Tabs,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { applicationStatusLabels, formatSalary, formatDate, timeAgo } from "@/lib/format";
import type { ApplicationStatus, MyApplicationListItem } from "@/types";

const statusOptions: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "interviewed", label: "Interviewed" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

function canWithdraw(status: ApplicationStatus): boolean {
  return status !== "accepted" && status !== "withdrawn";
}

function ApplicationCard({
  application,
  onWithdraw,
  onAcceptOffer,
}: {
  application: MyApplicationListItem;
  onWithdraw: (application: MyApplicationListItem) => void;
  onAcceptOffer: (application: MyApplicationListItem) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const job = application.jobId;
  const company = job.companyId;
  const offer = application.offerDetails;

  return (
    <li className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CompanyLogo name={company?.name} logo={company?.logo} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/jobs/${job._id}`}
                className="text-base font-semibold text-foreground hover:text-primary-700"
              >
                {job.title}
              </Link>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {company?.name ? <span className="font-medium text-primary-700">{company.name}</span> : null}
              {job.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {job.location}
                </span>
              ) : null}
              {job.salaryMin != null || job.salaryMax != null ? (
                <span className="font-medium text-slate-600">{formatSalary(job)}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-slate-500">Applied {timeAgo(application.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {application.status === "offered" && offer && (
            <Button size="sm" onClick={() => onAcceptOffer(application)}>
              <CheckCircle2 className="size-4" />
              Accept offer
            </Button>
          )}
          {canWithdraw(application.status) && (
            <Button variant="outline" size="sm" onClick={() => onWithdraw(application)}>
              Withdraw
            </Button>
          )}
        </div>
      </div>

      {application.status === "interview_scheduled" && application.interviewDetails?.date && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-warning-700">
          <CalendarClock className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Interview scheduled</p>
            <p>
              {formatDate(application.interviewDetails.date)}
              {application.interviewDetails.time ? ` · ${application.interviewDetails.time}` : ""}
              {application.interviewDetails.location
                ? ` · ${application.interviewDetails.location}`
                : ""}
            </p>
            {application.interviewDetails.meetingLink && (
              <a
                href={application.interviewDetails.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-block font-medium underline"
              >
                Join meeting
              </a>
            )}
          </div>
        </div>
      )}

      {offer && (
        <div className="mt-4 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700">
          <p className="font-medium">
            Offer:{" "}
            {formatSalary({ salaryMin: offer.salary, salaryCurrency: offer.currency, salaryPeriod: job.salaryPeriod })}
          </p>
          {offer.startDate && <p>Starting {formatDate(offer.startDate)}</p>}
          {offer.benefits && <p className="mt-0.5">{offer.benefits}</p>}
        </div>
      )}

      {application.withdrawalReason && (
        <p className="mt-3 text-xs text-slate-500">
          Withdrawal reason: {application.withdrawalReason}
        </p>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700"
          aria-expanded={historyOpen}
        >
          <ScrollText className="size-4" />
          Application timeline
          <ChevronDown className={cn("size-4 transition-transform", historyOpen && "rotate-180")} />
        </button>

        {historyOpen && (
          <ol className="mt-3 space-y-3 border-l-2 border-border pl-4">
            {(application.statusHistory ?? []).map((entry, index) => (
              <li key={`${entry.changedAt}-${index}`} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[23px] top-1 size-2.5 rounded-full border-2 border-surface bg-primary-600"
                />
                <p className="text-sm font-medium text-foreground">
                  {applicationStatusLabels[entry.status] ?? entry.status}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(entry.changedAt)}
                  {entry.notes ? ` — ${entry.notes}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

export function ApplicationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "timeline">("list");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [withdrawTarget, setWithdrawTarget] = useState<MyApplicationListItem | null>(null);
  const [offerTarget, setOfferTarget] = useState<MyApplicationListItem | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  const applications = useMyApplicationsPage({
    page,
    limit: 10,
    status: status === "all" ? undefined : status,
  });
  const timeline = useApplicationTimeline();
  const withdraw = useWithdrawApplication();
  const accept = useAcceptOffer();

  const selectStatus = (value: string) => {
    setStatus(value as ApplicationStatus | "all");
    setPage(1);
  };

  const confirmWithdraw = () => {
    if (!withdrawTarget) return;
    withdraw.mutate(
      { applicationId: withdrawTarget._id, reason: withdrawReason },
      {
        onSuccess: () => {
          setWithdrawTarget(null);
          setWithdrawReason("");
        },
      },
    );
  };

  const confirmAccept = () => {
    if (!offerTarget) return;
    accept.mutate(offerTarget._id, {
      onSuccess: () => setOfferTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My applications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track every role you&rsquo;ve applied to and act on offers.
        </p>
      </header>

      <Tabs
        items={[
          { value: "list", label: "Applications" },
          { value: "timeline", label: "Timeline" },
        ]}
        value={tab}
        onValueChange={(value) => setTab(value as "list" | "timeline")}
      />

      <TabContent value="list" activeValue={tab}>
        <div className="flex items-center justify-end">
          <Select
            aria-label="Filter by status"
            className="w-56"
            value={status}
            onChange={(event) => selectStatus(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {applications.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl bg-surface-sunken/60" />
            ))}
          </div>
        ) : applications.isError ? (
          <ErrorState
            className="mt-4"
            title="Couldn&rsquo;t load your applications"
            message={applications.error instanceof Error ? applications.error.message : undefined}
            onRetry={() => applications.refetch()}
          />
        ) : applications.data?.data.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Inbox className="size-6" />}
            title={status === "all" ? "No applications yet" : `No ${applicationStatusLabels[status]?.toLowerCase()} applications`}
            description="Browse open roles and hit Apply — every application will land here."
            actionLabel="Browse jobs"
            onAction={() => router.push("/jobs")}
          />
        ) : (
          <ul className="mt-4 space-y-4">
            {(applications.data?.data ?? []).map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onWithdraw={setWithdrawTarget}
                onAcceptOffer={setOfferTarget}
              />
            ))}
          </ul>
        )}

        {applications.data && applications.data.meta.totalPages > 1 && (
          <Pagination
            className="mt-6"
            page={applications.data.meta.page}
            totalPages={applications.data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </TabContent>

      <TabContent value="timeline" activeValue={tab}>
        {timeline.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-sunken/60" />
            ))}
          </div>
        ) : timeline.isError ? (
          <ErrorState
            className="mt-4"
            title="Couldn&rsquo;t load your timeline"
            onRetry={() => timeline.refetch()}
          />
        ) : (timeline.data?.timeline?.length ?? 0) === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<ScrollText className="size-6" />}
            title="Nothing on your timeline yet"
            description="Your applied dates and status changes will accumulate here."
          />
        ) : (
          <ol className="mt-4 space-y-6">
            {(timeline.data?.timeline ?? []).map((day) => (
              <li key={day.date}>
                <p className="text-sm font-semibold text-primary-700">{formatDate(day.date)}</p>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
                  {day.applications.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{item.jobTitle}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <CompanyLogo name={item.companyName} logo={item.companyLogo} size="sm" />
                          {item.companyName}
                        </p>
                      </div>
                      <ApplicationStatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </TabContent>

      <Modal
        open={withdrawTarget !== null}
        onClose={() => setWithdrawTarget(null)}
        title="Withdraw application"
        description={
          withdrawTarget
            ? `Remove your application for "${withdrawTarget.jobId.title}"?`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setWithdrawTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={withdraw.isPending}
              onClick={confirmWithdraw}
            >
              Withdraw
            </Button>
          </>
        }
      >
        <label htmlFor="withdraw-reason" className="block text-sm font-medium text-foreground">
          Reason (optional)
        </label>
        <Textarea
          id="withdraw-reason"
          className="mt-2"
          rows={3}
          maxLength={500}
          value={withdrawReason}
          onChange={(event) => setWithdrawReason(event.target.value)}
          placeholder="A short note for the employer…"
        />
      </Modal>

      <Modal
        open={offerTarget !== null}
        onClose={() => setOfferTarget(null)}
        title="Accept this offer?"
        description={
          offerTarget?.offerDetails?.startDate
            ? `Start date ${formatDate(offerTarget.offerDetails.startDate)}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOfferTarget(null)}>
              Not yet
            </Button>
            <Button loading={accept.isPending} onClick={confirmAccept}>
              <CheckCircle2 className="size-4" />
              Yes, accept
            </Button>
          </>
        }
      >
        {offerTarget && offerTarget.offerDetails && (
          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <FileText className="size-4 text-success-600" />
              <span className="font-medium text-success-700">
                {formatSalary({
                  salaryMin: offerTarget.offerDetails.salary,
                  salaryCurrency: offerTarget.offerDetails.currency,
                  salaryPeriod: offerTarget.jobId.salaryPeriod,
                })}
              </span>
            </p>
            {offerTarget.offerDetails.benefits ? (
              <p className="rounded-lg bg-surface-muted px-3 py-2">{offerTarget.offerDetails.benefits}</p>
            ) : null}
            {offerTarget.offerDetails.notes ? (
              <p className="rounded-lg bg-surface-muted px-3 py-2">{offerTarget.offerDetails.notes}</p>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}