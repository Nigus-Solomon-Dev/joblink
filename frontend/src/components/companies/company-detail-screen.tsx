"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  MapPin,
  Users,
} from "lucide-react";

import { CompanyLogo } from "@/components/companies/company-logo";
import { jobsApi } from "@/lib/api";
import { useCompanyBySlug } from "@/hooks/use-companies";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { JobListItem } from "@/types";
import { JobCard } from "@/components/jobs/job-card";
import { JobCardListSkeleton } from "@/components/jobs/job-card-skeleton";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { companySizeLabels } from "@/lib/format";

export interface CompanyDetailScreenProps {
  slug: string;
}

export function CompanyDetailScreen({ slug }: CompanyDetailScreenProps) {
  const companyQuery = useCompanyBySlug(slug);
  const company = companyQuery.data?.company;

  const openJobsQuery = useQuery({
    queryKey: ["jobs", "search", { companyId: company?._id, page: 1, limit: 12 }],
    queryFn: () => jobsApi.searchJobs({ companyId: company?._id as string, page: 1, limit: 12 }),
    enabled: Boolean(company?._id),
    placeholderData: keepPreviousData,
  });

  if (companyQuery.isLoading) {
    return (
      <div className="container-site py-8 sm:py-12">
        <Skeleton className="h-40 rounded-xl" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (companyQuery.isError || !company) {
    return (
      <div className="container-site py-16">
        <ErrorState
          title="Company not found"
          message={companyQuery.error instanceof Error ? companyQuery.error.message : undefined}
          onRetry={() => companyQuery.refetch()}
        />
      </div>
    );
  }

  const openJobs: JobListItem[] = openJobsQuery.data?.data ?? [];
  const loadingJobs = openJobsQuery.isLoading && openJobsQuery.data === undefined;

  return (
    <div className="container-site py-8 sm:py-12">
      {/* Company header */}
      <Card padding="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CompanyLogo name={company.name} logo={company.logo} size="lg" className="size-20" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {company.name}
                </h1>
                {company.isVerified && (
                  <Badge variant="success" size="md">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {company.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-slate-400" aria-hidden="true" />
                    {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-slate-400" aria-hidden="true" />
                    {company.location}
                  </span>
                )}
                {company.size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 text-slate-400" aria-hidden="true" />
                    {companySizeLabels[company.size]}
                  </span>
                )}
                {company.foundedYear && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
                    Founded {company.foundedYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
            >
              <Globe className="size-4" />
              Visit website
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border pt-5 text-sm">
          <span className="text-slate-500">
            <strong className="mr-1 text-foreground">{company.jobsCount ?? 0}</strong>
            open roles
          </span>
          <span className="text-slate-500">
            <strong className="mr-1 text-foreground">
              {(company.followersCount ?? 0).toLocaleString()}
            </strong>
            followers
          </span>
          <span className="text-slate-500">
            <strong className="mr-1 text-foreground">
              {(company.viewsCount ?? 0).toLocaleString()}
            </strong>
            profile views
          </span>
        </div>
      </Card>

      {/* About */}
      <div className="mt-8 space-y-6">
        {(company.description || company.culture) && (
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-foreground">About {company.name}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              {company.description && <p className="whitespace-pre-line">{company.description}</p>}
              {company.culture && <p className="whitespace-pre-line">{company.culture}</p>}
            </div>
          </Card>
        )}

        {company.benefits && company.benefits.length > 0 && (
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-foreground">Perks &amp; benefits</h2>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {company.benefits.map((benefit) => (
                <li key={benefit} className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent-500" aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">Open roles at {company.name}</h2>
            <Link
              href={`/jobs?query=${encodeURIComponent(company.name)}`}
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              View search
            </Link>
          </div>

          <div className="mt-4">
            {loadingJobs ? (
              <JobCardListSkeleton count={4} />
            ) : openJobsQuery.isError ? (
              <ErrorState
                title="Couldn't load open roles"
                onRetry={() => openJobsQuery.refetch()}
              />
            ) : openJobs.length === 0 ? (
              <EmptyState
                title="No open roles right now"
                description={`${company.name} isn't hiring publicly at the moment.`}
                icon={<Building2 className="size-6" />}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {openJobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}

            {openJobs.length > 0 && (
              <div className="mt-6">
                <Link
                  href={`/jobs?query=${encodeURIComponent(company.name)}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium text-primary-700 transition-colors hover:bg-surface-muted"
                >
                  See all roles
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}