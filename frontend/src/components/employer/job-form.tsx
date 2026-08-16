"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Search, X } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button, Checkbox, FormField, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { useAllCategories, useAllSkills } from "@/hooks/use-categories";
import { useMyCompanies } from "@/hooks/use-companies";
import { useCreateJob, useUpdateJob } from "@/hooks/use-jobs";
import {
  cleanJobPayload,
  defaultJobFormValues,
  jobFormSchema,
  type JobFormValues,
} from "@/lib/validations/employer";
import {
  educationLevelLabels,
  experienceLevelLabels,
  jobTypeLabels,
  remoteTypeLabels,
  salaryPeriodLabels,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import type { EmployerJob } from "@/types";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "remote", "hybrid"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
const EDUCATION_LEVELS = ["high_school", "diploma", "bachelor", "master", "phd", "any"] as const;
const REMOTE_TYPES = ["fully_remote", "hybrid", "on_site"] as const;
const SALARY_PERIODS = ["monthly", "yearly", "hourly"] as const;

function SkillPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  const { data } = useAllSkills(300);
  const [query, setQuery] = useState("");

  const skills = useMemo(() => {
    const list = data?.data ?? [];
    if (!query.trim()) return list;
    const needle = query.trim().toLowerCase();
    return list.filter((skill) => skill.name.toLowerCase().includes(needle));
  }, [data, query]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of data?.data ?? []) map.set(skill._id, skill.name);
    return map;
  }, [data]);

  const selected = new Set(value);

  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((existing) => existing !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search skills to add…"
          className="pl-9"
          aria-label="Filter skills"
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {nameById.get(id) ?? "Skill"}
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Remove ${nameById.get(id) ?? "skill"}`}
                className="text-primary-400 hover:text-primary-700"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 60).map((skill) => {
          const active = selected.has(skill._id);
          return (
            <button
              key={skill._id}
              type="button"
              onClick={() => toggle(skill._id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-border-strong bg-surface text-slate-600 hover:bg-surface-muted",
              )}
            >
              {active && <Check className="size-3" />}
              {skill.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function JobForm({
  mode,
  job,
}: {
  mode: "create" | "edit";
  job?: EmployerJob | null;
}) {
  const router = useRouter();
  const companies = useMyCompanies();
  const categories = useAllCategories();
  const create = useCreateJob();
  const updateJob = useUpdateJob();

  const initial = useMemo<JobFormValues>(() => {
    if (mode === "edit" && job) {
      return defaultJobFormValues({
        title: job.title,
        type: job.type,
        categoryId: typeof job.categoryId === "object" ? job.categoryId._id : job.categoryId,
        experienceLevel: job.experienceLevel,
        educationLevel: job.educationLevel,
        description: job.description,
        requirements: job.requirements ?? "",
        responsibilities: job.responsibilities ?? "",
        benefits: job.benefits ?? "",
        location: job.location,
        isRemote: job.isRemote,
        remoteType: job.remoteType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        salaryPeriod: job.salaryPeriod,
        applicationDeadline: job.applicationDeadline,
        skills: (job.skills ?? []).map((skill) => (typeof skill === "object" ? skill._id : skill)),
        status: job.status,
      });
    }
    return defaultJobFormValues();
  }, [mode, job]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema()),
    defaultValues: initial,
  });

  const statusValue = useWatch({ control, name: "status" });

  if (companies.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const company = companies.data?.companies?.[0];

  if (!company) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center shadow-card">
        <h2 className="text-lg font-semibold text-foreground">A company profile comes first</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          You need to create a company before posting jobs — every job belongs to a company.
        </p>
        <Link href="/employer/companies" className="mt-5 inline-flex">
          <Button>Set up your company</Button>
        </Link>
      </div>
    );
  }

  const companyIdToUse = company._id;

  const onSubmit = (values: JobFormValues) => {
    const payload = {
      ...cleanJobPayload(values),
      companyId: companyIdToUse,
    };

    if (mode === "edit" && job) {
      updateJob.mutate(
        { id: job._id, input: payload },
        {
          onSuccess: () => router.push("/employer/jobs"),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => router.push("/employer/jobs"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {mode === "edit" ? "Edit job" : "Post a new job"}
          </h1>
          <p className="text-sm text-slate-600">
            {mode === "edit"
              ? "Update the details below — changes go live immediately."
              : "Give applicants everything they need to decide."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/employer/jobs">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={create.isPending || updateJob.isPending}>
            {statusValue === "published" ? "Publish job" : "Save draft"}
          </Button>
        </div>
      </div>

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Basics</h2>
        <FormField label="Job title" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" placeholder="e.g. Frontend Developer" {...register("title")} invalid={Boolean(errors.title)} />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Category" htmlFor="categoryId" required error={errors.categoryId?.message}>
            <Select id="categoryId" {...register("categoryId")} invalid={Boolean(errors.categoryId)} disabled={categories.isPending}>
              <option value="">Choose a category…</option>
              {(categories.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Job type" htmlFor="type" required error={errors.type?.message}>
            <Select id="type" {...register("type")} invalid={Boolean(errors.type)}>
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {jobTypeLabels[type]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Experience level" htmlFor="experienceLevel" error={errors.experienceLevel?.message}>
            <Select id="experienceLevel" {...register("experienceLevel")} invalid={Boolean(errors.experienceLevel)}>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {experienceLevelLabels[level]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Education level" htmlFor="educationLevel" error={errors.educationLevel?.message}>
            <Select id="educationLevel" {...register("educationLevel")} invalid={Boolean(errors.educationLevel)}>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {educationLevelLabels[level]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Skills" hint="Pick the skills you'd like candidates to have." error={errors.skills?.message}>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => <SkillPicker value={field.value} onChange={field.onChange} />}
          />
        </FormField>
      </section>

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:col-span-2">Compensation & location</h2>
        <FormField label="Salary (min)" htmlFor="salaryMin" error={errors.salaryMin?.message} hint="Leave blank for negotiable.">
          <Input id="salaryMin" inputMode="numeric" placeholder="e.g. 20000" {...register("salaryMin")} invalid={Boolean(errors.salaryMin)} />
        </FormField>
        <FormField label="Salary (max)" htmlFor="salaryMax" error={errors.salaryMax?.message}>
          <Input id="salaryMax" inputMode="numeric" placeholder="e.g. 35000" {...register("salaryMax")} invalid={Boolean(errors.salaryMax)} />
        </FormField>
        <FormField label="Currency" htmlFor="salaryCurrency" error={errors.salaryCurrency?.message}>
          <Input id="salaryCurrency" placeholder="ETB" maxLength={3} {...register("salaryCurrency")} invalid={Boolean(errors.salaryCurrency)} />
        </FormField>
        <FormField label="Pay period" htmlFor="salaryPeriod">
          <Select id="salaryPeriod" {...register("salaryPeriod")}>
            {SALARY_PERIODS.map((period) => (
              <option key={period} value={period}>
                {salaryPeriodLabels[period]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Location" htmlFor="location" error={errors.location?.message}>
          <Input id="location" placeholder="e.g. Addis Ababa" {...register("location")} invalid={Boolean(errors.location)} />
        </FormField>
        <div className="flex items-end pb-2">
          <Controller
            control={control}
            name="isRemote"
            render={({ field }) => (
              <Checkbox checked={field.value} onChange={field.onChange} label="Fully remote" />
            )}
          />
        </div>
        <FormField label="Arrangement" htmlFor="remoteType">
          <Select id="remoteType" {...register("remoteType")}>
            {REMOTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {remoteTypeLabels[type]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Application deadline" htmlFor="applicationDeadline" error={errors.applicationDeadline?.message} hint="Optional. Format: YYYY-MM-DD">
          <Input id="applicationDeadline" placeholder="2027-01-31" {...register("applicationDeadline")} invalid={Boolean(errors.applicationDeadline)} />
        </FormField>
      </section>

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Details</h2>
        <FormField label="Description" htmlFor="description" required error={errors.description?.message} hint="Why is this a great opportunity? At least 50 characters.">
          <Textarea id="description" rows={5} placeholder="The role, the team, the impact…" {...register("description")} invalid={Boolean(errors.description)} />
        </FormField>
        <FormField label="Responsibilities" htmlFor="responsibilities" required error={errors.responsibilities?.message} hint="What will the person actually do? At least 20 characters.">
          <Textarea id="responsibilities" rows={4} placeholder="Day-to-day responsibilities…" {...register("responsibilities")} invalid={Boolean(errors.responsibilities)} />
        </FormField>
        <FormField label="Requirements" htmlFor="requirements" required error={errors.requirements?.message} hint="Must-haves and nice-to-haves. At least 20 characters.">
          <Textarea id="requirements" rows={4} placeholder="Experience, skills, education…" {...register("requirements")} invalid={Boolean(errors.requirements)} />
        </FormField>
        <FormField label="Benefits" htmlFor="benefits" error={errors.benefits?.message} hint="Perks, benefits and extras.">
          <Textarea id="benefits" rows={3} placeholder="Health cover, transport, lunch, growth budget…" {...register("benefits")} invalid={Boolean(errors.benefits)} />
        </FormField>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <FormField label="Status" htmlFor="status" hint={mode === "create" ? "Save as a draft now, or publish right away." : undefined}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select id="status" {...field} className="max-w-xs">
                <option value="draft">Draft</option>
                {statusValue !== "archived" && <option value="published">Published (live)</option>}
                {mode === "edit" && job?.status === "published" && <option value="closed">Closed</option>}
              </Select>
            )}
          />
        </FormField>
      </section>
    </form>
  );
}