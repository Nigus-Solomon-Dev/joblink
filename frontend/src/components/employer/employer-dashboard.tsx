"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  Eye,
  FileText,
  Hourglass,
  Plus,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { ApplicationStatusBadge } from "@/components/seeker/application-status-badge";
import { Badge, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/hooks/use-auth";
import { useCompanyPerformance } from "@/hooks/use-analytics";
import {
  useCompanyTeam,
  useEmployerAnalytics,
  useEmployerCompanies,
  useEmployerStats,
  useSubscription,
} from "@/hooks/use-employer-dashboard";
import { cn } from "@/lib/cn";
import type { AnalyticsPeriod } from "@/types";
import {
  applicationStatusLabels,
  companyMemberRoleLabels,
  jobStatusLabels,
  subscriptionPlanLabels,
  timeAgo,
} from "@/lib/format";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null | undefined;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-foreground">{value ?? "–"}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MiniBars({
  data,
  height = 56,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <div className="flex h-full items-end gap-1.5">
      {data.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1" title={`${point.label}: ${point.value}`}>
          <span className="text-[10px] leading-none text-slate-500">{point.value || ""}</span>
          <div
            className="w-full rounded-t-md bg-primary-200 transition-colors hover:bg-primary-400"
            style={{ height: `${Math.max(4, (point.value / max) * height)}px` }}
          />
          <span className="truncate text-[10px] text-slate-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

const PERIODS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "365d", label: "1y" },
];

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5 shadow-card", className)}>
      {children}
    </div>
  );
}

export function EmployerDashboard() {
  const { user } = useAuth();
  const stats = useEmployerStats();
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const analytics = useEmployerAnalytics(period);
  const companies = useEmployerCompanies();
  const subscription = useSubscription();

  const overview = stats.data?.overview;
  const companyList = companies.data?.companies ?? [];
  const activeCompanyId = companyList[0]?._id;
  const team = useCompanyTeam(activeCompanyId);
  const performance = useCompanyPerformance(activeCompanyId);

  const recent = stats.data?.recentApplications ?? [];
  const topJobs = stats.data?.topJobs ?? [];

  const jobsSeries = analytics.data?.jobsOverTime ?? [];
  const applicationsSeries = analytics.data?.applicationsOverTime ?? [];
  const byStatus = analytics.data?.applicationsByStatus ?? {};
  const byType = analytics.data?.jobsByType ?? {};

  const statusEntries = Object.entries(byStatus) as Array<[keyof typeof byStatus, number]>;
  const typeEntries = Object.entries(byType) as Array<[keyof typeof byType, number]>;
  const maxStatus = Math.max(1, ...statusEntries.map(([, value]) => value));
  const maxType = Math.max(1, ...typeEntries.map(([, value]) => value));

  if (stats.isError) {
    return (
      <div className="space-y-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Employer dashboard
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Welcome back.</h1>
        </header>
        <ErrorState
          title="Couldn't load your dashboard"
          message="We couldn't fetch your hiring overview. Check your connection and try again."
          onRetry={() => stats.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Employer dashboard
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            A look at your hiring — posted jobs, applicants and pipeline health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employer/applicants">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50">
              Applicants
              <ArrowRight className="size-4" />
            </span>
          </Link>
          <Link href="/employer/jobs/new">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-700">
              <Plus className="size-4" />
              Post a job
            </span>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active jobs" value={overview?.activeJobs} icon={<Briefcase className="size-5" />} />
        <StatCard label="Applications" value={overview?.totalApplications} icon={<FileText className="size-5" />} />
        <StatCard label="Pending review" value={overview?.pendingApplications} icon={<Hourglass className="size-5" />} />
        <StatCard label="Interviews" value={overview?.interviewedApplications} icon={<CalendarClock className="size-5" />} />
        <StatCard label="Hired" value={overview?.hiredApplications} icon={<UserRoundCheck className="size-5" />} />
        <StatCard label="Profile views" value={overview?.totalViews} icon={<Eye className="size-5" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <SectionHeading title="Hiring cadence" subtitle={`New jobs & applications, last ${period}`} />
            </div>
            <div className="flex rounded-lg border border-border-strong p-0.5">
              {PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    period === option.value
                      ? "bg-primary-600 text-white"
                      : "text-slate-600 hover:bg-surface-muted",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {analytics.isError ? (
            <ErrorState
              title="Couldn't load analytics"
              message="We couldn't fetch your hiring analytics for this period."
              onRetry={() => analytics.refetch()}
              className="mt-2 py-8"
            />
          ) : (
            <>
            <div className="grid grid-cols-2 gap-6 pt-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Jobs posted</p>
              <div className="h-20">
                <MiniBars data={jobsSeries.map((point) => ({ label: point._id.slice(5), value: point.count }))} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {jobsSeries.length === 0 ? "Nothing posted in this window yet." : ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Applications</p>
              <div className="h-20">
                <MiniBars data={applicationsSeries.map((point) => ({ label: point._id.slice(5), value: point.count }))} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {applicationsSeries.length === 0 ? "No applications in this window yet." : ""}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-6 border-t border-border pt-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By status</p>
              <div className="space-y-2">
                {statusEntries.length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}
                {statusEntries.map(([status, value]) => (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-slate-600">{applicationStatusLabels[status] ?? status}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-accent-500" style={{ width: `${(value / maxStatus) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-slate-500">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By job type</p>
              <div className="space-y-2">
                {typeEntries.length === 0 && <p className="text-sm text-slate-500">No jobs yet.</p>}
                {typeEntries.map(([type, value]) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-slate-600">{type.replaceAll("_", " ")}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-primary-400" style={{ width: `${(value / maxType) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-slate-500">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Company performance" subtitle="Rolling lifetime figures for your company" />
          {performance.isError ? (
            <ErrorState
              title="Couldn't load performance"
              message="We couldn't fetch your company's performance figures."
              onRetry={() => performance.refetch()}
              className="py-8"
            />
          ) : (
          <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs text-slate-500">Jobs</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {performance.data?.overview.totalJobs ?? "–"}
              </p>
              <p className="text-xs text-slate-500">{(performance.data?.overview.activeJobs ?? 0) + " active"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs text-slate-500">Applications</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {performance.data?.overview.totalApplications ?? "–"}
              </p>
              <p className="text-xs text-slate-500">{performance.data?.overview.conversionRate ?? 0}% / job</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs text-slate-500">Views</p>
              <p className="mt-1 text-xl font-bold text-foreground">{performance.data?.overview.totalViews ?? "–"}</p>
              <p className="text-xs text-slate-500">{performance.data?.companyMetrics.viewsPerJob ?? 0} per job</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs text-slate-500">Saves</p>
              <p className="mt-1 text-xl font-bold text-foreground">{performance.data?.overview.totalSaves ?? "–"}</p>
              <p className="text-xs text-slate-500">{performance.data?.companyMetrics.savesPerJob ?? 0} per job</p>
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top performing jobs</p>
            <div className="space-y-2">
              {topJobs.length === 0 && <p className="text-sm text-slate-500">Post your first job to see it here.</p>}
              {topJobs.map((job) => (
                <div key={job._id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                    <p className="text-xs text-slate-500">{jobStatusLabels[job.status] ?? job.status}</p>
                  </div>
                  <span className="text-xs text-slate-500">{job.viewsCount ?? 0} views</span>
                  <span className="text-xs text-slate-500">{job.applicationsCount ?? 0} apps</span>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeading title="Recent applications" subtitle="Latest to hit your inbox" />
          <div className="divide-y divide-border">
            {recent.length === 0 && <p className="text-sm text-slate-500">No applications yet — share a job to get started.</p>}
            {recent.map((application) => {
              const job = typeof application.jobId === "object" && application.jobId ? application.jobId : null;
              const applicant = typeof application.applicantId === "object" && application.applicantId ? application.applicantId : null;
              return (
                <div key={application._id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {job?.title ?? "Job"}
                      <span className="ml-1.5 font-normal text-slate-500">· {applicant?.name ?? "Applicant"}</span>
                    </p>
                    <p className="text-xs text-slate-500">{timeAgo(application.createdAt)}</p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
              );
            })}
          </div>
          {recent.length > 0 && (
            <Link href="/employer/applicants" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
              Open applicant list
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <SectionHeading title="Your company" subtitle="Profile and team at a glance" />
            {companyList.length === 0 && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-slate-500">You haven&rsquo;t set up a company yet.</p>
                <Link href="/employer/companies">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-700">
                    <Building2 className="size-4" />
                    Create your company
                  </span>
                </Link>
              </div>
            )}
            {companyList.map((company) => {
              const creator = typeof company.ownerId === "object" && company.ownerId ? company.ownerId : null;
              const statsForRow = company.stats;
              return (
                <div key={company._id} className="flex items-start gap-3">
                  <CompanyLogo name={company.name} logo={company.logo} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {creator?.name ?? "You"} · {company.location || "Location not set"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="primary" size="sm">{statsForRow?.openJobsCount ?? 0} open</Badge>
                      <Badge variant="neutral" size="sm">{statsForRow?.applicationsCount ?? 0} applications</Badge>
                      <Badge variant="neutral" size="sm">{statsForRow?.viewsCount ?? 0} views</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
            {companyList.length > 0 && (
              <Link href="/employer/companies" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
                Manage company
                <ArrowRight className="size-4" />
              </Link>
            )}
          </Panel>

          <Panel>
            <SectionHeading title="Plan & subscription" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-foreground">
                  {subscriptionPlanLabels[subscription.data?.user?.plan ?? "free"] ?? subscription.data?.user?.plan ?? "Free"} plan
                </span>
              </div>
              <Badge variant={subscription.data?.user?.status === "active" ? "success" : "warning"}>
                {subscription.data?.user?.status ?? "active"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {subscription.data?.companies?.length ?? 0} company subscription(s) on this account.
            </p>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-foreground">Team</h2>
              <Link href="/employer/companies" className="text-sm font-medium text-primary-700 hover:underline">Manage</Link>
            </div>
            {!activeCompanyId && <p className="mt-3 text-sm text-slate-500">Set up a company to manage your team.</p>}
            <div className="mt-3 space-y-2">
              {(team.data?.members ?? []).map((member) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                    {member.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{member.user?.name ?? "Member"}</p>
                    {member.user?.email && <p className="truncate text-xs text-slate-500">{member.user.email}</p>}
                  </div>
                  <span className="text-xs text-slate-500">{companyMemberRoleLabels[member.role] ?? member.role}</span>
                </div>
              ))}
              {activeCompanyId && team.isPending && (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
              {activeCompanyId && team.isError && (
                <ErrorState
                  title="Couldn't load your team"
                  message="We couldn't fetch your company's members."
                  onRetry={() => team.refetch()}
                  className="py-6"
                />
              )}
              {activeCompanyId && team.data?.members?.length === 0 && (
                <p className="text-sm text-slate-500">The owner is the only member.</p>
              )}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}