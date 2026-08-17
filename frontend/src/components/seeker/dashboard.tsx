"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  CalendarClock,
  FileText,
  Inbox,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { ApplicationStatusBadge } from "@/components/seeker/application-status-badge";
import { JobCard } from "@/components/jobs/job-card";
import {
  useActivityHeatmap,
  useDashboardStats,
  useProfileCompleteness,
  useRecommendedJobs,
  useSkillGap,
} from "@/hooks/use-jobseeker-dashboard";
import { useUnreadNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, Skeleton } from "@/components/ui";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

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

function CompanyName({ company }: { company?: { name?: string; slug?: string; logo?: string | null } }) {
  if (!company) return <span className="text-slate-500">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <CompanyLogo name={company.name} logo={company.logo} size="sm" />
      <span className="truncate text-sm font-medium text-slate-600">{company.name}</span>
    </span>
  );
}

export function SeekerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const stats = useDashboardStats();
  const completeness = useProfileCompleteness();
  const recommended = useRecommendedJobs(6);
  const skillGap = useSkillGap();
  const heatmap = useActivityHeatmap();
  const { data: unreadResult } = useUnreadNotifications();

  const overview = stats.data?.overview;
  const heatmapData = heatmap.data?.heatmap ?? [];
  const maxHeat = Math.max(1, ...heatmapData.map((entry) => entry.count));
  const recentApplications = stats.data?.recentApplications ?? [];
  const upcomingInterviews = stats.data?.upcomingInterviews ?? [];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Job seeker dashboard
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Here&rsquo;s where your job hunt stands today.
          </p>
        </div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          View applications
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Applications" value={overview?.totalApplications} icon={<FileText className="size-5" />} />
        <StatCard label="In review" value={overview?.underReviewApplications} icon={<Briefcase className="size-5" />} />
        <StatCard label="Interviews" value={overview?.interviewApplications} icon={<CalendarClock className="size-5" />} />
        <StatCard label="Offers won" value={overview?.acceptedApplications} icon={<UserRoundCheck className="size-5" />} />
        <StatCard label="Saved jobs" value={overview?.totalSavedJobs} icon={<Bookmark className="size-5" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent activity</h2>
            <p className="text-sm text-slate-500">
              {unreadResult?.count ? (
                <>
                  You have{" "}
                  <Link href="/notifications" className="font-medium text-primary-700 hover:underline">
                    {unreadResult.count} unread notification{unreadResult.count === 1 ? "" : "s"}
                  </Link>
                  .
                </>
              ) : (
                "Your latest applications and updates."
              )}
            </p>

            <div className="mt-4">
              {stats.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : recentApplications.length === 0 ? (
                <EmptyState
                  icon={<Inbox className="size-6" />}
                  title="No applications yet"
                  description="Browse jobs and apply to start tracking everything in one place."
                  actionLabel="Browse jobs"
                  onAction={() => router.push("/jobs")}
                />
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
                  {recentApplications.map((application) => {
                    const ref = application.jobId ?? application.job;
                    const job =
                      typeof ref === "object" && ref
                        ? ref
                        : { _id: String(ref ?? ""), title: undefined, companyId: undefined };
                    return (
                      <li key={application._id} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/jobs/${job._id}`}
                            className="block truncate text-sm font-semibold text-foreground hover:text-primary-700"
                          >
                            {job.title ?? "Untitled job"}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <CompanyName company={job.companyId} />
                            <span aria-hidden="true">·</span>
                            <span>{timeAgo(application.createdAt)}</span>
                          </div>
                        </div>
                        <ApplicationStatusBadge status={application.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent-700" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Recommended for you</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {recommended.isLoading ? (
                Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)
              ) : recommended.data?.jobs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No recommendations yet —{" "}
                  <Link href="/profile" className="font-medium text-primary-700 hover:underline">
                    add skills to your profile
                  </Link>{" "}
                  to get better matches.
                </p>
              ) : (
                (recommended.data?.jobs ?? []).map((job) => (
                  <div key={job._id} className="relative">
                    {typeof job.skillMatchCount === "number" &&
                      job.skillMatchCount > 0 && (
                        <span className="absolute -top-2 right-3 z-10 rounded-full bg-accent-700 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                          {job.skillMatchCount}{" "}
                          {job.skillMatchCount === 1 ? "skill" : "skills"} match you
                        </span>
                      )}
                    <JobCard key={job._id} job={job} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Target className="size-4 text-accent-700" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Skill gaps</h2>
            </div>
            {skillGap.isLoading ? (
              <Skeleton className="mt-4 h-20 w-full rounded-xl" />
            ) : (skillGap.data?.skills?.length ?? 0) > 0 ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Skills that appear often in jobs you haven&rsquo;t matched yet — consider adding or
                learning them.
              </p>
            ) : null}
            {(skillGap.data?.skills?.length ?? 0) > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {(skillGap.data?.skills ?? []).slice(0, 8).map((skill) => (
                  <li
                    key={skill._id}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill.name}
                    <span className="ml-1.5 text-slate-400">
                      {skill.demand} {skill.demand === 1 ? "job" : "jobs"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              !skillGap.isLoading && (
                <p className="mt-2 text-sm text-slate-500">
                  No skill gaps detected — your profile already covers in-demand skills.
                </p>
              )
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Profile completeness</h2>
              <Link href="/profile" className="text-xs font-medium text-primary-700 hover:underline">
                Complete
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="grid size-16 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#f0a35f ${completeness.data?.percentage ?? 0}%, #ebe1d0 0)`,
                }}
                role="presentation"
              >
                <span className="grid size-13 place-items-center rounded-full bg-surface text-sm font-bold text-primary-800">
                  {completeness.data?.percentage ?? "–"}%
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-foreground">
                    {completeness.data?.completedWeight ?? 0}
                  </span>{" "}
                  of {completeness.data?.totalWeight ?? 100} points filled
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Complete your profile to stand out to employers.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Upcoming interviews</h2>
            {stats.isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No interviews scheduled yet. Keep applying — they&rsquo;ll show up here.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {upcomingInterviews.map((application) => {
                  const ref = application.jobId;
                  const job = typeof ref === "object" && ref ? ref : { _id: "", title: "Untitled job" };
                  const interview = application.interviewDetails;
                  return (
                    <li key={application._id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${job._id}`}
                          className="block truncate text-sm font-semibold text-foreground hover:text-primary-700"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDate(interview?.date)}
                          {interview?.time ? ` · ${interview.time}` : ""}
                          {interview?.location ? ` · ${interview.location}` : ""}
                        </p>
                      </div>
                      <ApplicationStatusBadge status={application.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Your activity</h2>
            {heatmap.isLoading ? (
              <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            ) : heatmapData.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No activity yet — your applications and saves will appear here.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-1.5" role="img" aria-label="Activity by day">
                  {heatmapData.slice(-28).map((entry) => (
                    <span
                      key={entry.date}
                      title={`${entry.count} action${entry.count === 1 ? "" : "s"} on ${entry.date}`}
                      aria-hidden="true"
                      className={cn(
                        "size-5 rounded",
                        entry.count === 0 && "bg-surface-sunken",
                        entry.count === 1 && "bg-accent-200",
                        entry.count >= 2 && entry.count < maxHeat && "bg-accent-500/70",
                        entry.count >= maxHeat && "bg-accent-700",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Last 28 days of applications and saved jobs.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}