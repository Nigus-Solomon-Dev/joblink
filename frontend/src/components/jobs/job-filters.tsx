"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

import type { ExperienceLevel, JobFacets, JobType } from "@/types";
import type { JobQueryParams } from "@/lib/api/jobs";

import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  experienceLevelLabels,
  jobTypeLabels,
} from "@/lib/format";

export interface JobFiltersValue {
  query: string;
  categoryId: string;
  location: string;
  type: string;
  experienceLevel: string;
  salaryRange: string;
  workArrangement: string;
  postedWithin: string;
  companyId: string;
}

export const emptyJobFilters: JobFiltersValue = {
  query: "",
  categoryId: "",
  location: "",
  type: "",
  experienceLevel: "",
  salaryRange: "",
  workArrangement: "",
  postedWithin: "",
  companyId: "",
};

export interface SalaryBucket {
  value: string;
  label: string;
  min?: number;
  max?: number;
}

export const salaryRangeOptions: SalaryBucket[] = [
  { value: "", label: "Any salary" },
  { value: "0-5000", label: "Up to ETB 5,000", max: 5000 },
  { value: "5000-10000", label: "ETB 5,000 – 10,000", min: 5000, max: 10000 },
  { value: "10000-20000", label: "ETB 10,000 – 20,000", min: 10000, max: 20000 },
  { value: "20000-30000", label: "ETB 20,000 – 30,000", min: 20000, max: 30000 },
  { value: "30000-50000", label: "ETB 30,000 – 50,000", min: 30000, max: 50000 },
  { value: "50000-100000", label: "ETB 50,000 – 100,000", min: 50000, max: 100000 },
  { value: "100000+", label: "ETB 100,000+", min: 100000 },
];

export const workArrangementOptions = [
  { value: "", label: "Any arrangement" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const postedWithinOptions = [
  { value: "", label: "Any time" },
  { value: "7", label: "Past 7 days" },
  { value: "14", label: "Past 14 days" },
  { value: "30", label: "Past 30 days" },
];

export interface JobFiltersProps {
  value: JobFiltersValue;
  facets?: JobFacets;
  onChange: (next: JobFiltersValue) => void;
  className?: string;
}

/** Convert the filter form state into backend search query params. */
export function filtersToParams(value: JobFiltersValue): JobQueryParams {
  const params: JobQueryParams = {};
  if (value.query.trim()) params.query = value.query.trim();
  if (value.categoryId) params.categoryId = value.categoryId;
  if (value.location.trim()) params.location = value.location.trim();
  if (value.type) params.type = value.type as JobType;
  if (value.experienceLevel) params.experienceLevel = value.experienceLevel as ExperienceLevel;
  const bucket = salaryRangeOptions.find((option) => option.value === value.salaryRange);
  if (bucket?.min != null) params.salaryMin = bucket.min;
  if (bucket?.max != null) params.salaryMax = bucket.max;
  if (value.workArrangement) params.workArrangement = value.workArrangement as JobQueryParams["workArrangement"];
  if (value.postedWithin) params.postedWithin = value.postedWithin;
  if (value.companyId) params.companyId = value.companyId;
  return params;
}

function countLabel(label: string, count?: number): string {
  if (count === undefined) return label;
  return `${label} (${count})`;
}

export function JobFilters({ value, facets, onChange, className }: JobFiltersProps) {
  const update = (patch: Partial<JobFiltersValue>) => onChange({ ...value, ...patch });

  const hasActiveFilters = Object.values(value).some((v) => v !== "");

  const typeCounts = new Map(
    facets?.types.map((item) => [item.type, item.count] as const) ?? [],
  );
  const experienceCounts = new Map(
    facets?.experienceLevels.map((item) => [item.level, item.count] as const) ?? [],
  );
  const arrangementCounts = new Map(
    facets?.workArrangements.map((item) => [item.type, item.count] as const) ?? [],
  );
  const salaryCounts = new Map(
    facets?.salaryRanges.map((item) => [String(item.range), item.count] as const) ?? [],
  );

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className={cn("space-y-5", className)}
      aria-label="Filter jobs"
    >
      <FormGroup label="Keywords">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={value.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Title, description…"
            className="pl-9"
            aria-label="Search keywords"
          />
        </div>
      </FormGroup>

      <FormGroup label="Category">
        <Select
          value={value.categoryId}
          onChange={(event) => update({ categoryId: event.target.value })}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {facets?.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {countLabel(category.name, category.count)}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Company">
        <Select
          value={value.companyId}
          onChange={(event) => update({ companyId: event.target.value })}
          aria-label="Company"
        >
          <option value="">All companies</option>
          {facets?.companies.map((company) => (
            <option key={company.id} value={company.id}>
              {countLabel(company.name, company.count)}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Location">
        <Input
          value={value.location}
          onChange={(event) => update({ location: event.target.value })}
          placeholder="Addis Ababa, Hawassa…"
          list="job-location-options"
          aria-label="Location"
        />
        {facets && facets.locations.length > 0 && (
          <datalist id="job-location-options">
            {facets.locations.map((item) => (
              <option key={item.location} value={item.location}>
                {countLabel(item.location, item.count)}
              </option>
            ))}
          </datalist>
        )}
      </FormGroup>

      <FormGroup label="Employment type">
        <Select
          value={value.type}
          onChange={(event) => update({ type: event.target.value })}
          aria-label="Employment type"
        >
          <option value="">All types</option>
          {Object.entries(jobTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {countLabel(label, typeCounts.get(key as JobType))}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Experience level">
        <Select
          value={value.experienceLevel}
          onChange={(event) => update({ experienceLevel: event.target.value })}
          aria-label="Experience level"
        >
          <option value="">Any level</option>
          {Object.entries(experienceLevelLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {countLabel(label, experienceCounts.get(key as ExperienceLevel))}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Work arrangement">
        <Select
          value={value.workArrangement}
          onChange={(event) => update({ workArrangement: event.target.value })}
          aria-label="Work arrangement"
        >
          {workArrangementOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {countLabel(option.label, option.value ? arrangementCounts.get(option.value as never) : undefined)}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Salary range">
        <Select
          value={value.salaryRange}
          onChange={(event) => update({ salaryRange: event.target.value })}
          aria-label="Salary range"
        >
          {salaryRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {countLabel(option.label, option.value ? salaryCounts.get(option.value) : undefined)}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup label="Posted within">
          <Select
            value={value.postedWithin}
            onChange={(event) => update({ postedWithin: event.target.value })}
            aria-label="Posted within"
          >
            {postedWithinOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormGroup>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange(emptyJobFilters)}
        >
          <X className="size-3.5" />
          Clear all filters
        </Button>
      )}
    </form>
  );
}

function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}