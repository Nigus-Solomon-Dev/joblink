import type { JobListItem, SavedJob } from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export interface SavedJobsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  search?: string;
}

export async function getSavedJobs(
  params: SavedJobsQueryParams = {},
): Promise<Paginated<JobListItem>> {
  return unwrapPaginated<JobListItem>(
    await http.get("/saved-jobs", { params: { ...params } }),
  );
}

export async function isJobSaved(jobId: string): Promise<{ isSaved: boolean }> {
  return unwrap<{ isSaved: boolean }>(
    await http.get(`/saved-jobs/${encodeURIComponent(jobId)}/is-saved`),
  );
}

export async function saveJob(
  jobId: string,
  notes?: string,
): Promise<{ savedJob: SavedJob }> {
  return unwrap<{ savedJob: SavedJob }>(
    await http.post(`/saved-jobs/${encodeURIComponent(jobId)}`, { notes }),
  );
}

export async function unsaveJob(jobId: string): Promise<null> {
  return unwrap<null>(await http.delete(`/saved-jobs/${encodeURIComponent(jobId)}`));
}

export async function updateSavedJobNotes(
  jobId: string,
  notes: string,
): Promise<{ savedJob: SavedJob }> {
  return unwrap<{ savedJob: SavedJob }>(
    await http.patch(`/saved-jobs/${encodeURIComponent(jobId)}/notes`, { notes }),
  );
}

export async function getSavedJobCount(): Promise<{ count: number }> {
  return unwrap<{ count: number }>(await http.get("/saved-jobs/count"));
}
