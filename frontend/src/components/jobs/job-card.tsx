import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

import type { JobListItem } from "@/types";

import { CompanyLogo } from "@/components/companies/company-logo";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  deadlineHint,
  experienceLevelLabels,
  formatSalary,
  jobTypeLabels,
  remoteTypeLabels,
  timeAgo,
} from "@/lib/format";

export interface JobCardProps {
  job: JobListItem;
  className?: string;
}

const VALID_REMOTE_TYPES = ["fully_remote", "hybrid", "on_site"] as const;

export function JobCard({ job, className }: JobCardProps) {
  const company = job.companyId;
  const companyName = company?.name ?? "Company";
  const companySlug = company?.slug;
  const showRemote = job.remoteType && VALID_REMOTE_TYPES.includes(job.remoteType as never);
  const deadline = deadlineHint(job);

  return (
    <Card hoverable className={cn("group relative", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo name={companyName} logo={company?.logo} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {companySlug ? (
                <Link
                  href={`/companies/${companySlug}`}
                  className="text-sm font-medium text-primary-700 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {companyName}
                </Link>
              ) : (
                <span className="text-sm font-medium text-primary-700">{companyName}</span>
              )}
              {company?.isVerified && (
                <BadgeCheck className="size-3.5 text-success-600" aria-label="Verified company" />
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="size-3" aria-hidden="true" />
              <span>{job.location || "Location not specified"}</span>
            </p>
          </div>
        </div>
        <SaveJobButton jobId={job._id} />
      </div>

      <Link href={`/jobs/${job._id}`} className="mt-3 block">
        <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary-700">
          {job.title}
        </h3>
      </Link>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge variant="primary" size="sm">
          {jobTypeLabels[job.type]}
        </Badge>
        <Badge variant="neutral" size="sm">
          {experienceLevelLabels[job.experienceLevel]}
        </Badge>
        {showRemote && (
          <Badge variant="outline" size="sm">
            {remoteTypeLabels[job.remoteType]}
          </Badge>
        )}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {job.skills.slice(0, 3).map((skill) => (
            <span key={skill._id} className="rounded-md bg-surface-muted px-2 py-1 text-slate-600">
              {skill.name}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-1 py-1 text-slate-400">+{job.skills.length - 3} more</span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-sm font-semibold text-primary-700">{formatSalary(job)}</span>
        <span className="text-xs text-slate-500">
          {timeAgo(job.publishedAt)}
          {deadline && <span className="ml-2 text-warning-700">{deadline}</span>}
        </span>
      </div>
    </Card>
  );
}