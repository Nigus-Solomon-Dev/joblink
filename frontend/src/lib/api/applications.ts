import type {
  Application,
  ApplicationStatus,
  BulkUpdateResult,
  CompanyApplicationStats,
  EmployerApplicationListItem,
  InterviewInput,
  MyApplication,
  MyApplicationListItem,
  OfferInput,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export interface ApplyPayload {
  coverLetter?: string;
  resume?: string;
  portfolio?: string;
  expectedSalary?: number | null;
  availabilityDate?: string | null;
}

export async function applyToJob(
  jobId: string,
  payload: ApplyPayload,
): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.post(`/applications/jobs/${encodeURIComponent(jobId)}/apply`, payload),
  );
}

export async function getMyApplications(
  params: Partial<{ page: number; limit: number; sort?: string; status?: string }> = {},
): Promise<Paginated<MyApplication>> {
  return unwrapPaginated<MyApplication>(
    await http.get("/applications/my-applications", { params: { ...params } }),
  );
}

export interface MyApplicationsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: ApplicationStatus;
}

/**
 * Seekers' own applications with full job references (salary, location, type).
 * Uses the seeker-scoped endpoint so the list carries everything the UI needs.
 */
export async function getMyApplicationsPage(
  params: MyApplicationsQueryParams = {},
): Promise<Paginated<MyApplicationListItem>> {
  return unwrapPaginated<MyApplicationListItem>(
    await http.get("/jobseeker/dashboard/applications", { params: { ...params } }),
  );
}

export async function getApplication(applicationId: string): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.get(`/applications/${encodeURIComponent(applicationId)}`),
  );
}

export async function withdrawApplication(
  applicationId: string,
  reason?: string,
): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.post(`/applications/${encodeURIComponent(applicationId)}/withdraw`, {
      reason: reason?.trim() || undefined,
    }),
  );
}

export async function acceptOffer(applicationId: string): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.post(`/applications/${encodeURIComponent(applicationId)}/accept`),
  );
}

/* ------------------------------------------------------------------ */
/* Employer-side                                                       */
/* ------------------------------------------------------------------ */

export interface EmployerApplicationsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: ApplicationStatus;
  jobId?: string;
}

/** `GET /applications/company/:companyId` */
export async function getCompanyApplications(
  companyId: string,
  params: EmployerApplicationsQueryParams = {},
): Promise<Paginated<EmployerApplicationListItem>> {
  return unwrapPaginated<EmployerApplicationListItem>(
    await http.get(`/applications/company/${encodeURIComponent(companyId)}`, {
      params: { ...params },
    }),
  );
}

/** `GET /applications/job/:jobId` */
export async function getJobApplications(
  jobId: string,
  params: EmployerApplicationsQueryParams = {},
): Promise<Paginated<EmployerApplicationListItem>> {
  return unwrapPaginated<EmployerApplicationListItem>(
    await http.get(`/applications/job/${encodeURIComponent(jobId)}`, {
      params: { ...params },
    }),
  );
}

/** `GET /applications/company/:companyId/stats` */
export async function getCompanyApplicationStats(
  companyId: string,
): Promise<CompanyApplicationStats> {
  return unwrap<CompanyApplicationStats>(
    await http.get(`/applications/company/${encodeURIComponent(companyId)}/stats`),
  );
}

/** `PATCH /applications/:id/status` (employer/admin). */
export async function updateApplicationStatus(
  applicationId: string,
  payload: { status: ApplicationStatus; notes?: string },
): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.patch(
      `/applications/${encodeURIComponent(applicationId)}/status`,
      { status: payload.status, notes: payload.notes?.trim() || undefined },
    ),
  );
}

/** `POST /applications/:id/interview` (under_review / shortlisted only). */
export async function scheduleInterview(
  applicationId: string,
  details: InterviewInput,
): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.post(`/applications/${encodeURIComponent(applicationId)}/interview`, details),
  );
}

/** `POST /applications/:id/offer` (interviewed only). */
export async function makeOffer(
  applicationId: string,
  details: OfferInput,
): Promise<{ application: Application }> {
  return unwrap<{ application: Application }>(
    await http.post(`/applications/${encodeURIComponent(applicationId)}/offer`, details),
  );
}

/** `POST /applications/bulk-update` */
export async function bulkUpdateApplicationStatus(
  payload: { applicationIds: string[]; status: ApplicationStatus; notes?: string },
): Promise<{ results: BulkUpdateResult[] }> {
  return unwrap<{ results: BulkUpdateResult[] }>(
    await http.post("/applications/bulk-update", payload),
  );
}
