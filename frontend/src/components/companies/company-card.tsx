import Link from "next/link";
import { BadgeCheck, Briefcase, MapPin } from "lucide-react";

import type { Company } from "@/types";

import { CompanyLogo } from "@/components/companies/company-logo";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { companySizeLabels } from "@/lib/format";

export interface CompanyCardProps {
  company: Company;
  className?: string;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  const jobsCount = company.jobsCount ?? 0;

  return (
    <Card hoverable className={cn("group", className)}>
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} logo={company.logo} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/companies/${company.slug}`}
            className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground transition-colors group-hover:text-primary-700"
          >
            <span className="truncate">{company.name}</span>
            {company.isVerified && (
              <BadgeCheck className="size-4 shrink-0 text-success-600" aria-label="Verified company" />
            )}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {company.industry && <span>{company.industry}</span>}
            {company.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {company.location}
              </span>
            )}
            {company.size && <span>{companySizeLabels[company.size]}</span>}
          </div>
        </div>
      </div>

      {company.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{company.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Badge variant="primary" size="sm">
          <Briefcase className="size-3" />
          {jobsCount > 0 ? `${jobsCount} open ${jobsCount === 1 ? "role" : "roles"}` : "No open roles"}
        </Badge>
        {company.followersCount ? (
          <span className="text-xs text-slate-500">
            {company.followersCount.toLocaleString()} followers
          </span>
        ) : null}
      </div>
    </Card>
  );
}