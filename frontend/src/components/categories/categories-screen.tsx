"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useCategoriesWithJobs } from "@/hooks/use-categories";

export function CategoriesScreen() {
  const categoriesQuery = useCategoriesWithJobs();
  const categories = categoriesQuery.data?.categories ?? [];

  return (
    <div className="container-site py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Browse by field
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Categories</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pick a category to see the latest open roles in that field.
        </p>
      </div>

      <div className="mt-8">
        {categoriesQuery.isLoading && categoriesQuery.data === undefined ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <ErrorState
            title="Couldn't load categories"
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories will appear here once employers start posting jobs."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/jobs?query=${encodeURIComponent(category.name)}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-5 py-5 shadow-card transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary-800">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {category.jobsCount} open {category.jobsCount === 1 ? "role" : "roles"}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-primary-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}