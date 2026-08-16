import { z } from "zod";

import type { JobInput, JobType } from "@/types";

export const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Describe your company in a bit more detail (min 10 characters)")
    .max(2000, "Description cannot exceed 2000 characters"),
  website: z
    .union([z.literal(""), z.string().trim().url("Enter a valid URL (https://…)")])
    .optional(),
  industry: z
    .union([z.literal(""), z.string().trim().max(100, "Industry cannot exceed 100 characters")])
    .optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
  location: z
    .union([z.literal(""), z.string().trim().max(100, "Location cannot exceed 100 characters")])
    .optional(),
  foundedYear: z
    .union([z.literal(""), z.coerce.number().int().min(1900).max(new Date().getFullYear())])
    .optional(),
  linkedin: z
    .union([z.literal(""), z.string().trim().regex(/^https?:\/\/(www\.)?linkedin\.com\/.*/, "Enter a valid LinkedIn URL")])
    .optional(),
  twitter: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/, "Enter a valid Twitter/X URL"),
    ])
    .optional(),
  facebook: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^https?:\/\/(www\.)?facebook\.com\/.*/, "Enter a valid Facebook URL"),
    ])
    .optional(),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export function cleanCompanyPayload(values: CompanyFormValues) {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    description: values.description.trim(),
    size: values.size,
  };
  const website = values.website?.trim();
  if (website) payload.website = website;
  const industry = values.industry?.trim();
  if (industry) payload.industry = industry;
  const location = values.location?.trim();
  if (location) payload.location = location;
  const foundedYear = values.foundedYear;
  if (foundedYear !== undefined && foundedYear !== "") payload.foundedYear = Number(foundedYear);
  const socialLinks: Record<string, string> = {};
  for (const key of ["linkedin", "twitter", "facebook"] as const) {
    const value = values[key]?.trim();
    if (value) socialLinks[key] = value;
  }
  if (Object.keys(socialLinks).length > 0) payload.socialLinks = socialLinks;
  return payload;
}

/* ------------------------------------------------------------------ */
/* Job create / update                                                 */
/* ------------------------------------------------------------------ */

const jobTypes = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "remote",
  "hybrid",
] as const satisfies readonly JobType[];

const experienceLevels = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;

const educationLevels = [
  "high_school",
  "diploma",
  "bachelor",
  "master",
  "phd",
  "any",
] as const;

const remoteTypes = ["fully_remote", "hybrid", "on_site"] as const;

const salaryPeriods = ["monthly", "yearly", "hourly"] as const;

export function jobFormSchema() {
  return z.object({
    title: z.string().trim().min(5, "Job title must be at least 5 characters").max(100),
    type: z.enum(jobTypes),
    categoryId: z.string().min(1, "Choose a category"),
    experienceLevel: z.enum(experienceLevels),
    educationLevel: z.enum(educationLevels),
    description: z.string().trim().min(50, "Write at least 50 characters").max(5000),
    requirements: z.string().trim().min(20, "Add at least 20 characters of requirements").max(3000),
    responsibilities: z
      .string()
      .trim()
      .min(20, "Add at least 20 characters of responsibilities")
      .max(3000),
    benefits: z.string().trim().max(2000, "Benefits cannot exceed 2000 characters").optional(),
    location: z.string().trim().max(100, "Location cannot exceed 100 characters").optional(),
    isRemote: z.boolean(),
    remoteType: z.enum(remoteTypes),
    salaryMin: z
      .union([z.literal(""), z.string().trim().regex(/^\d+$/, "Enter a whole number")])
      .optional(),
    salaryMax: z
      .union([z.literal(""), z.string().trim().regex(/^\d+$/, "Enter a whole number")])
      .optional(),
    salaryCurrency: z
      .union([z.literal(""), z.string().trim().toUpperCase().length(3, "Use a 3-letter code")])
      .optional(),
    salaryPeriod: z.enum(salaryPeriods),
    applicationDeadline: z
      .union([z.literal(""), z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD)")])
      .optional(),
    skills: z.array(z.string()),
    status: z.enum(["draft", "published", "closed", "expired", "archived"]),
  });
}

export type JobFormValues = z.infer<ReturnType<typeof jobFormSchema>>;

/** Convert validated form values into the `JobInput` the API expects. */
export function cleanJobPayload(values: JobFormValues): JobInput {
  const salaryMin = values.salaryMin === "" || !values.salaryMin ? null : Number(values.salaryMin);
  const salaryMax = values.salaryMax === "" || !values.salaryMax ? null : Number(values.salaryMax);

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    requirements: values.requirements.trim(),
    responsibilities: values.responsibilities.trim(),
    benefits: values.benefits?.trim() || undefined,
    type: values.type,
    experienceLevel: values.experienceLevel,
    educationLevel: values.educationLevel,
    salaryMin,
    salaryMax,
    salaryCurrency: values.salaryCurrency?.trim().toUpperCase() || "ETB",
    salaryPeriod: values.salaryPeriod,
    location: values.location?.trim() || undefined,
    isRemote: values.isRemote,
    remoteType: values.remoteType,
    applicationDeadline: values.applicationDeadline || null,
    categoryId: values.categoryId,
    companyId: "",
    skills: values.skills,
    status: values.status,
  };
}

/** Empty values keyed to the form — preprocess turns blank inputs into null-safe numbers. */
export function defaultJobFormValues(initial: Partial<JobInput> = {}): JobFormValues {
  return {
    title: initial.title ?? "",
    type: initial.type ?? "full_time",
    categoryId: initial.categoryId ?? "",
    experienceLevel: initial.experienceLevel ?? "mid",
    educationLevel: initial.educationLevel ?? "any",
    description: initial.description ?? "",
    requirements: initial.requirements ?? "",
    responsibilities: initial.responsibilities ?? "",
    benefits: initial.benefits ?? "",
    location: initial.location ?? "",
    isRemote: initial.isRemote ?? false,
    remoteType: initial.remoteType ?? "on_site",
    salaryMin:
      initial.salaryMin != null ? String(initial.salaryMin) : "",
    salaryMax:
      initial.salaryMax != null ? String(initial.salaryMax) : "",
    salaryCurrency: initial.salaryCurrency ?? "",
    salaryPeriod: initial.salaryPeriod ?? "monthly",
    applicationDeadline:
      initial.applicationDeadline ? initial.applicationDeadline.slice(0, 10) : "",
    skills: initial.skills ?? [],
    status: initial.status ?? "draft",
  };
}

/** Parse a job into an update payload for `PATCH /jobs`. */
export function jobUpdatePayload(values: JobFormValues): Partial<JobInput> {
  return cleanJobPayload(values);
}