"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useSkillsGrouped } from "@/hooks/use-categories";

export function SkillsScreen() {
  const skillsQuery = useSkillsGrouped();
  const groups = skillsQuery.data?.skills;

  return (
    <div className="container-site py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Skills in demand
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Skills</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Browse skills hired on JobLink, grouped by field. Select one to find matching jobs.
        </p>
      </div>

      <div className="mt-8">
        {skillsQuery.isLoading && skillsQuery.data === undefined ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }, (_, groupIndex) => (
              <div key={groupIndex}>
                <Skeleton className="h-5 w-40" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: 8 }, (_, skillIndex) => (
                    <Skeleton key={skillIndex} className="h-8 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : skillsQuery.isError ? (
          <ErrorState title="Couldn't load skills" onRetry={() => skillsQuery.refetch()} />
        ) : (!groups || Object.keys(groups).length === 0) ? (
          <EmptyState
            title="No skills yet"
            description="Skills will appear here as roles get posted."
          />
        ) : (
          <div className="space-y-10">
            {Object.entries(groups).map(([category, skills]) =>
              skills.length === 0 ? null : (
                <section key={category}>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    {category}
                    <span className="text-sm font-normal text-slate-400">
                      {skills.length} {skills.length === 1 ? "skill" : "skills"}
                    </span>
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Link
                        key={skill._id}
                        href={`/jobs?query=${encodeURIComponent(skill.name)}`}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-slate-700 shadow-card transition-colors hover:border-primary-300 hover:bg-primary-50"
                      >
                        {skill.name}
                        {skill.jobsCount ? (
                          <span className="text-xs font-semibold text-primary-600">
                            {skill.jobsCount}
                          </span>
                        ) : null}
                        <ArrowRight className="size-3 transition-opacity opacity-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}