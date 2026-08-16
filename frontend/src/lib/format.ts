import { format, formatDistanceToNowStrict } from "date-fns";

import type {
  CompanySize,
  ExperienceLevel,
  JobType,
  RemoteType,
  SalaryPeriod,
} from "@/types";

export const jobTypeLabels: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  entry: "Entry level",
  junior: "Junior",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

export const educationLevelLabels: Record<string, string> = {
  high_school: "High school",
  diploma: "Diploma",
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD",
  any: "Any level",
};

export const salaryPeriodLabels: Record<SalaryPeriod, string> = {
  monthly: "month",
  yearly: "year",
  hourly: "hour",
};

export const remoteTypeLabels: Record<RemoteType, string> = {
  fully_remote: "Remote",
  hybrid: "Hybrid",
  on_site: "On-site",
};

export const companySizeLabels: Record<CompanySize, string> = {
  "1-10": "1–10 employees",
  "11-50": "11–50 employees",
  "51-200": "51–200 employees",
  "201-500": "201–500 employees",
  "501-1000": "501–1,000 employees",
  "1000+": "1,000+ employees",
};

export const applicationStatusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview scheduled",
  interviewed: "Interviewed",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const notificationTypeLabels: Record<string, string> = {
  job_application: "Job application",
  application_status_update: "Application update",
  new_job_match: "New job match",
  message: "Message",
  system: "System",
};

export const interviewTypeLabels: Record<string, string> = {
  phone: "Phone interview",
  video: "Video interview",
  in_person: "In-person interview",
};

export const jobStatusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  expired: "Expired",
  archived: "Archived",
};

export const companyMemberRoleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  recruiter: "Recruiter",
  viewer: "Viewer",
};

export const subscriptionPlanLabels: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface SalarySource {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  salaryRange?: string;
}

export function formatSalary(job: SalarySource): string {
  if (job.salaryRange) return job.salaryRange;
  const currency = job.salaryCurrency ?? "ETB";
  const period = salaryPeriodLabels[job.salaryPeriod ?? "monthly"];
  const fmt = (n: number) => n.toLocaleString();

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${currency} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)} / ${period}`;
  }
  if (job.salaryMin != null) {
    return `${currency} ${fmt(job.salaryMin)}+ / ${period}`;
  }
  if (job.salaryMax != null) {
    return `Up to ${currency} ${fmt(job.salaryMax)} / ${period}`;
  }
  return "Negotiable";
}

export function timeAgo(date?: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDistanceToNowStrict(parsed, { addSuffix: true });
}

export function formatDate(date?: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(parsed, "MMM d, yyyy");
}

export function formatClock(date?: string | null): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(parsed, "h:mm a");
}

/** `Closes soon` helper text for a job with a deadline. */
export function deadlineHint(
  job: { applicationDeadline?: string | null; isExpired?: boolean },
): string | null {
  if (job.isExpired) return "Closed";
  if (!job.applicationDeadline) return null;
  const deadline = new Date(job.applicationDeadline);
  if (Number.isNaN(deadline.getTime())) return null;
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 7) return `Closes in ${days} days`;
  return null;
}