import type {
  EmployerJob,
  Job,
  JobDetailResult,
  JobFacets,
  JobInput,
  JobListItem,
  JobStats,
  JobStatus,
  JobType,
  SearchSuggestions,
} from "@/types";
import type { ExperienceLevel } from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export type WorkArrangementFilter = "remote" | "hybrid" | "onsite";

export interface JobQueryParams {
  query?: string;
  categoryId?: string;
  location?: string;
  type?: JobType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  companyId?: string;
  featured?: boolean;
  skills?: string[];
  postedWithin?: string;
  workArrangement?: WorkArrangementFilter;
  sort?: string;
  page?: number;
  limit?: number;
}

/** Parameters the facets endpoint understands (subset of the search filters). */
export type FacetQueryParams = Pick<
  JobQueryParams,
  "query" | "categoryId" | "location" | "type" | "experienceLevel" | "skills"
>;

type Primitive = string | number | boolean | undefined;

function queryString(params: Record<string, Primitive | Primitive[]>): Record<string, Primitive> {
  const result: Record<string, Primitive> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) result[key] = value.join(",");
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function searchJobs(
  params: JobQueryParams,
): Promise<Paginated<JobListItem>> {
  return unwrapPaginated<JobListItem>(
    await http.get("/search", { params: queryString({ ...params }) }),
  );
}

export async function getJobs(
  params: JobQueryParams,
): Promise<Paginated<JobListItem>> {
  return unwrapPaginated<JobListItem>(
    await http.get("/jobs", { params: queryString({ ...params }) }),
  );
}

export async function getFeaturedJobs(limit = 8): Promise<{ jobs: JobListItem[] }> {
  return unwrap<{ jobs: JobListItem[] }>(
    await http.get("/jobs/featured", { params: { limit } }),
  );
}

export async function getJob(id: string): Promise<{ job: JobDetailResult }> {
  return unwrap<{ job: JobDetailResult }>(await http.get(`/jobs/${encodeURIComponent(id)}`));
}

export async function getFacets(
  filters: FacetQueryParams = {},
): Promise<JobFacets> {
  return unwrap<JobFacets>(
    await http.get("/search/facets", { params: queryString({ ...filters }) }),
  );
}

export async function getSuggestions(query: string): Promise<SearchSuggestions> {
  return unwrap<SearchSuggestions>(
    await http.get("/search/suggestions", { params: { q: query } }),
  );
}

/* ------------------------------------------------------------------ */
/* Job management (poster)                                             */
/* ------------------------------------------------------------------ */

export interface MyJobsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: JobStatus;
  type?: JobType;
}

/**
 * Jobs put up by the current user. The backend defaults to `published`
 * when no `status` is sent, so the status must always be passed explicitly
 * to see drafts/closed/archived rows.
 */
export async function getMyJobs(
  params: MyJobsQueryParams = {},
): Promise<Paginated<EmployerJob>> {
  return unwrapPaginated<EmployerJob>(
    await http.get("/jobs/my-jobs", { params: { ...params } }),
  );
}

/** `POST /jobs` (job starts as `draft` unless a `status` is sent). */
export async function createJob(input: JobInput): Promise<{ job: Job }> {
  return unwrap<{ job: Job }>(await http.post("/jobs", input));
}

/** `PATCH /jobs/:id` */
export async function updateJob(
  id: string,
  input: Partial<JobInput>,
): Promise<{ job: Job }> {
  return unwrap<{ job: Job }>(
    await http.patch(`/jobs/${encodeURIComponent(id)}`, input),
  );
}

/** `DELETE /jobs/:id` — hard delete, also removes the job's applications. */
export async function deleteJob(id: string): Promise<void> {
  await http.delete(`/jobs/${encodeURIComponent(id)}`);
}

/** `POST /jobs/:id/publish` */
export async function publishJob(id: string): Promise<{ job: Job }> {
  return unwrap<{ job: Job }>(
    await http.post(`/jobs/${encodeURIComponent(id)}/publish`),
  );
}

/** `POST /jobs/:id/close` */
export async function closeJob(id: string): Promise<{ job: Job }> {
  return unwrap<{ job: Job }>(
    await http.post(`/jobs/${encodeURIComponent(id)}/close`),
  );
}

/** `POST /jobs/:id/archive` */
export async function archiveJob(id: string): Promise<{ job: Job }> {
  return unwrap<{ job: Job }>(
    await http.post(`/jobs/${encodeURIComponent(id)}/archive`),
  );
}

/** `GET /jobs/:id/stats` (protected — for the job posters' row metrics). */
export async function getJobStats(id: string): Promise<JobStats> {
  return unwrap<JobStats>(
    await http.get(`/jobs/${encodeURIComponent(id)}/stats`),
  );
}
