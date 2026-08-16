"use client";

import { useState } from "react";
import { Building2, Search } from "lucide-react";

import { CompanyCard } from "@/components/companies/company-card";
import {
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Skeleton,
} from "@/components/ui";
import { useCompanies } from "@/hooks/use-companies";

function CompanyCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <Skeleton className="mt-4 h-12 w-full" />
      <Skeleton className="mt-4 h-5 w-28" />
    </div>
  );
}

export function CompaniesScreen() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const companiesQuery = useCompanies({ search, page, limit: 12 });
  const companies = companiesQuery.data?.data ?? [];
  const meta = companiesQuery.data?.meta;

  return (
    <div className="container-site py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Employers
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Find companies hiring now
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Explore the teams posting on JobLink and see their open roles.
        </p>
      </div>

      <div className="mt-8">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by company name…"
            className="pl-9"
            aria-label="Search companies"
          />
        </div>
      </div>

      <div className="mt-8">
        {companiesQuery.isError ? (
          <ErrorState
            title="Couldn't load companies"
            message={companiesQuery.error instanceof Error ? companiesQuery.error.message : undefined}
            onRetry={() => companiesQuery.refetch()}
          />
        ) : companiesQuery.isLoading && companiesQuery.data === undefined ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <CompanyCardSkeleton key={index} />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            title={search ? `No companies match “${search}”` : "No companies yet"}
            description={
              search
                ? "Try a different name."
                : "Employers haven't listed their companies yet. Check back soon."
            }
            icon={<Building2 className="size-6" />}
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600" aria-live="polite">
              {(meta?.total ?? companies.length).toLocaleString()} company
              {(meta?.total ?? companies.length) === 1 ? "" : "ies"}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard key={company._id} company={company} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={meta?.totalPages ?? 1}
              onPageChange={setPage}
              className="pt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}