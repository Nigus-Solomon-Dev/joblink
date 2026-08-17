"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import {
  emptyJobFilters,
  filtersToParams,
  JobFilters,
  type JobFiltersValue,
} from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import { Button, Modal } from "@/components/ui";
import { useFacets, useJobSearch } from "@/hooks/use-jobs";
import { isApiError } from "@/types/api";

export function JobSearchScreen() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") ?? "";
  const initialCategoryId = searchParams.get("categoryId") ?? "";
  const initialLocation = searchParams.get("location") ?? "";

  const [filters, setFilters] = useState<JobFiltersValue>({
    ...emptyJobFilters,
    query: initialQuery,
    categoryId: initialCategoryId,
    location: initialLocation,
  });
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilters = (next: JobFiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const params = useMemo(() => filtersToParams(filters), [filters]);
  const searchQuery = useJobSearch({ ...params, sort, page, limit: 10, featured: undefined });

  const facetsQuery = useFacets({
    query: params.query ?? "",
    categoryId: params.categoryId,
    location: params.location,
    type: params.type,
    experienceLevel: params.experienceLevel,
    skills: params.skills,
  });

  return (
    <div className="container-site py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Open positions
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Find your next role
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {filters.query
            ? `Results for “${filters.query}”.`
            : "Search by keyword, then narrow results with location, salary, and more."}
        </p>
      </div>

      <div className="mt-8 flex gap-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-surface p-5 shadow-card">
            <JobFilters
              value={filters}
              facets={facetsQuery.data}
              onChange={updateFilters}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
            <p className="text-sm text-slate-600">
              {(searchQuery.isLoading && searchQuery.data === undefined) ||
              searchQuery.isError
                ? ""
                : `${(searchQuery.data?.meta?.total ?? 0).toLocaleString()} ${
                    (searchQuery.data?.meta?.total ?? 0) === 1 ? "job" : "jobs"
                  }`}
            </p>
          </div>

          <JobList
            jobs={searchQuery.data?.data ?? []}
            meta={searchQuery.data?.meta}
            page={page}
            sort={sort}
            isLoading={searchQuery.isLoading}
            isError={searchQuery.isError}
            errorMessage={
              searchQuery.error instanceof Error ? searchQuery.error.message : undefined
            }
            onPageChange={setPage}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            onRetry={() => searchQuery.refetch()}
          />
        </div>
      </div>

      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filter jobs"
        description="Narrow results by category, salary, and more."
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setMobileFiltersOpen(false)}>
            Apply filters
          </Button>
        }
      >
        <JobFilters value={filters} facets={facetsQuery.data} onChange={updateFilters} />
        {isApiError(searchQuery.error) && (
          <p role="alert" className="mt-3 text-sm text-danger-600">
            {searchQuery.error.message}
          </p>
        )}
      </Modal>
    </div>
  );
}