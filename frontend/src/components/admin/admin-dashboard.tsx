"use client";

import type { ReactNode } from "react";
import {
  Building2,
  Briefcase,
  FileText,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Panel, SectionHeading } from "@/components/shared/admin-panels";
import { timeAgo } from "@/lib/format";
import { useAdminOverview, useAuditLogs, useSystemHealth } from "@/hooks/use-admin";
import { DistributionBars } from "@/components/shared/charts";
import { Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import type { ApplicationStatus, JobStatus, UserRole, UserStatus } from "@/types";

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

function fmtBytes(bytes: number | undefined): string {
  if (!bytes) return "–";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export function AdminDashboard() {
  const overview = useAdminOverview();
  const health = useSystemHealth();
  const audit = useAuditLogs({ limit: 15 });

  const overviewData = overview.data;
  const o = overviewData?.overview;

  const usersByRole = Object.entries(overviewData?.usersByRole ?? {}) as Array<[UserRole, number]>;
  const usersByStatus = Object.entries(overviewData?.usersByStatus ?? {}) as Array<[UserStatus, number]>;
  const jobsByStatus = Object.entries(overviewData?.jobsByStatus ?? {}) as Array<[JobStatus, number]>;
  const appsByStatus = Object.entries(overviewData?.applicationsByStatus ?? {}) as Array<[ApplicationStatus, number]>;

  if (overview.isError) {
    return (
      <div className="space-y-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">System overview</h1>
        </header>
        <ErrorState
          title="Couldn't load the dashboard"
          message="We couldn't fetch the platform overview. Check your connection and try again."
          onRetry={() => overview.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">System overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live counts, platform health and recent cross-entity activity.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total users" value={o?.totalUsers} icon={<Users className="size-5" />} />
        <StatCard label="Companies" value={o?.totalCompanies} icon={<Building2 className="size-5" />} />
        <StatCard label="Jobs" value={o?.totalJobs} icon={<Briefcase className="size-5" />} />
        <StatCard label="Applications" value={o?.totalApplications} icon={<FileText className="size-5" />} />
        <StatCard label="Verified" value={o?.verifiedCompanies} icon={<ShieldCheck className="size-5" />} />
        <StatCard label="Pending review" value={o?.pendingVerificationCompanies} icon={<HeartPulse className="size-5" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeading title="Users" subtitle="Breakdown by role and status" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By role</p>
              <DistributionBars entries={usersByRole} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">By status</p>
              <DistributionBars entries={usersByStatus} />
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading title="Pipeline" subtitle="Jobs and applications by status" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Jobs</p>
              <DistributionBars entries={jobsByStatus} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Applications</p>
              <DistributionBars entries={appsByStatus} />
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeading title="Recent activity" subtitle="Latest signups, companies and jobs" />
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Users</p>
              <ul className="space-y-2">
                {overview.isPending && <Skeleton className="h-12 w-full" />}
                {(overviewData?.recentActivity.users ?? []).map((user) => (
                  <li key={user._id} className="rounded-lg border border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Companies</p>
              <ul className="space-y-2">
                {(overviewData?.recentActivity.companies ?? []).map((company) => (
                  <li key={company._id} className="rounded-lg border border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{company.name}</p>
                    <p className="text-xs text-slate-500">
                      {company.isVerified ? "Verified" : "Unverified"} · {timeAgo(company.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Jobs</p>
              <ul className="space-y-2">
                {(overviewData?.recentActivity.jobs ?? []).map((job) => {
                  const company = typeof job.companyId === "object" && job.companyId ? job.companyId.name : undefined;
                  return (
                    <li key={job._id} className="rounded-lg border border-border px-3 py-2">
                      <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                      <p className="truncate text-xs text-slate-500">{company ?? "—"} · {timeAgo(job.createdAt)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading title="System health" subtitle="Updated every 2 minutes" />
          {health.isPending && <Skeleton className="h-40 w-full" />}
          {health.data && (
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Uptime</dt>
                <dd className="font-medium text-foreground">
                  {Math.floor(health.data.uptime / 3600)}h {Math.floor((health.data.uptime % 3600) / 60)}m
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Memory</dt>
                <dd className="font-medium text-foreground">{fmtBytes(health.data.memoryUsage?.heapUsed)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Error rate</dt>
                <dd className="font-medium text-foreground">{(health.data.errorRate * 100).toFixed(2)}%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Avg response</dt>
                <dd className="font-medium text-foreground">{health.data.avgResponseTime.toFixed(2)} ms</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Collections</dt>
                <dd className="font-medium text-foreground">{health.data.database?.collections ?? "–"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">DB size</dt>
                <dd className="font-medium text-foreground">{fmtBytes(health.data.database?.storageSize)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Email queue</dt>
                <dd className="font-medium text-foreground">{health.data.queue?.queueLength ?? "–"} queued</dd>
              </div>
            </dl>
          )}
          {health.isError && <p className="text-sm text-danger-600">Health check unavailable.</p>}
        </Panel>
      </section>

      <Panel>
        <SectionHeading title="Audit log" subtitle="Recent moderation and platform events" />
        <div className="divide-y divide-border">
          {(audit.data?.data ?? []).map((entry, index) => (
            <div key={`${entry.entityId}-${entry.timestamp}-${index}`} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{entry.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{entry.entityType.replaceAll("_", " ")}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{timeAgo(entry.timestamp)}</span>
            </div>
          ))}
          {(audit.data?.data ?? []).length === 0 && !audit.isPending && !audit.isError && (
            <p className="py-4 text-sm text-slate-500">No recent activity.</p>
          )}
          {audit.isError && (
            <ErrorState
              title="Couldn't load the audit log"
              message="We couldn't fetch recent platform events."
              onRetry={() => audit.refetch()}
              className="py-8"
            />
          )}
        </div>
      </Panel>
    </div>
  );
}