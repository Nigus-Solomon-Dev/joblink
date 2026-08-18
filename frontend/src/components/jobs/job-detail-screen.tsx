"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Briefcase,
  CalendarClock,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { ApplyForm } from "@/components/jobs/apply-form";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Modal,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { useAppliedJobIds } from "@/hooks/use-applications";
import { useAuth } from "@/hooks/use-auth";
import { useJobDetail } from "@/hooks/use-jobs";
import {
  deadlineHint,
  educationLevelLabels,
  experienceLevelLabels,
  formatDate,
  formatSalary,
  jobTypeLabels,
  remoteTypeLabels,
  timeAgo,
} from "@/lib/format";

export interface JobDetailScreenProps {
  jobId: string;
}

export function JobDetailScreen({ jobId }: JobDetailScreenProps) {
  const router = useRouter();
  const detail = useJobDetail(jobId);
  const appliedIds = useAppliedJobIds();
  const { user, status } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);

  const job = detail.data?.job;
  const isApplied = job ? appliedIds.data?.has(job._id) ?? false : false;
  const isClosed = job?.isExpired || job?.status === "closed";
  const deadline = job ? deadlineHint(job) : null;

  if (detail.isLoading) {
    return (
      <div className="container-site py-8 sm:py-12">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-10 w-2/3" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (detail.isError || !job) {
    return (
      <div className="container-site py-16">
        <ErrorState
          title="Job not found"
          message={detail.error instanceof Error ? detail.error.message : undefined}
          onRetry={() => detail.refetch()}
        />
      </div>
    );
  }

  const company = job.companyId;
  const companyName = typeof company === "object" && company ? company.name : "Company";

  const renderApplyArea = () => {
    if (isClosed) {
      return (
        <Badge variant="neutral" size="md">
          This job is no longer accepting applications
        </Badge>
      );
    }
    if (isApplied) {
      return (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
          You&rsquo;ve applied for this job
        </div>
      );
    }
    if (status === "loading") {
      return (
        <Button fullWidth disabled>
          <Spinner className="size-4" aria-label="Checking" />
          Checking…
        </Button>
      );
    }
    if (status === "unauthenticated" || !user) {
      return (
        <Button fullWidth onClick={() => router.push(`/login?next=/jobs/${jobId}`)}>
          Log in to apply
        </Button>
      );
    }
    if (user.role !== "job_seeker") {
      return (
        <p className="text-sm text-slate-600">
          Employers can&rsquo;t apply to jobs.{" "}
          <Link href="/register" className="text-primary-700 underline">
            Post a job
          </Link>{" "}
          instead.
        </p>
      );
    }
    return (
      <Button fullWidth size="lg" onClick={() => setApplyOpen(true)}>
        Apply now
      </Button>
    );
  };

  return (
    <div className="container-site py-8 sm:py-12">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="min-w-0">
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="primary" size="sm">
                {jobTypeLabels[job.type]}
              </Badge>
              {job.featured && (
                <Badge variant="warning" size="sm">
                  <Sparkles className="size-3" />
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {job.title}
            </h1>

            <p className="mt-2 text-sm font-medium text-primary-700">{formatSalary(job)}</p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-slate-400" aria-hidden="true" />
                {job.location || "Location not specified"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-slate-400" aria-hidden="true" />
                Posted {timeAgo(job.publishedAt)}
              </span>
              {deadline && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-slate-400" aria-hidden="true" />
                  {deadline}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <Badge variant="neutral" size="sm">
                {experienceLevelLabels[job.experienceLevel]}
              </Badge>
              <Badge variant="neutral" size="sm">
                {educationLevelLabels[job.educationLevel]}
              </Badge>
              {job.remoteType && (
                <Badge variant="outline" size="sm">
                  {remoteTypeLabels[job.remoteType]}
                </Badge>
              )}
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5 text-xs">
                {job.skills.map((skill, index) => (
                  <span
                    key={skill._id ?? `${skill.name}-${index}`}
                    className="rounded-md bg-surface-muted px-2 py-1 text-slate-600"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="mt-6 space-y-6">
            {job.description && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-foreground">About this job</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.description}
                </div>
              </Card>
            )}

            {job.responsibilities && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-foreground">Responsibilities</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.responsibilities}
                </div>
              </Card>
            )}

            {job.requirements && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-foreground">Requirements</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.requirements}
                </div>
              </Card>
            )}

            {job.benefits && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-foreground">Benefits</h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.benefits}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card padding="lg" className="space-y-6">
            <div className="flex items-center gap-4">
              <CompanyLogo name={companyName} logo={company?.logo} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{companyName}</p>
                {typeof company === "object" && company && company.slug && (
                  <Link
                    href={`/companies/${company.slug}`}
                    className="text-sm font-medium text-primary-700 hover:underline"
                  >
                    View company
                  </Link>
                )}
              </div>
            </div>

            <dl className="space-y-3 border-t border-border pt-5 text-sm">
              <MetaRow icon={<MapPin className="size-4" />} label="Location" value={job.location || "Not specified"} />
              <MetaRow icon={<Briefcase className="size-4" />} label="Employment type" value={jobTypeLabels[job.type]} />
              <MetaRow icon={<Banknote className="size-4" />} label="Salary" value={formatSalary(job)} />
              <MetaRow
                icon={<CalendarClock className="size-4" />}
                label="Deadline"
                value={job.applicationDeadline ? formatDate(job.applicationDeadline) : "Rolling"}
              />
              <MetaRow
                icon={<BadgeCheck className="size-4" />}
                label="Applications"
                value={job.applicationsCount?.toLocaleString() ?? "—"}
              />
            </dl>

            <div className="space-y-3 border-t border-border pt-5">
              {renderApplyArea()}
              {!isClosed && !isApplied && <SaveJobButton jobId={jobId} withLabel fullWidth />}
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply — ${job.title}`}
        description="A few optional details help your application stand out."
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setApplyOpen(false)}>
            Cancel
          </Button>
        }
      >
        <ApplyForm
          jobId={jobId}
          onSubmitted={() => {
            setApplyOpen(false);
            appliedIds.refetch();
          }}
        />
      </Modal>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="inline-flex items-center gap-2 text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}