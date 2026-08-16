"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  archiveJob,
  closeJob,
  createJob,
  deleteJob,
  getFacets,
  getFeaturedJobs,
  getJob,
  getJobStats as fetchJobStats,
  getMyJobs,
  getSuggestions,
  publishJob,
  searchJobs,
  updateJob,
  type FacetQueryParams,
  type JobQueryParams,
  type MyJobsQueryParams,
} from "@/lib/api/jobs";
import type { EmployerJob, JobInput, JobStatus } from "@/types";

export function useJobSearch(params: JobQueryParams) {
  return useQuery({
    queryKey: ["jobs", "search", params],
    queryFn: () => searchJobs(params),
    placeholderData: keepPreviousData,
  });
}

export function useFacets(filters: FacetQueryParams = {}) {
  return useQuery({
    queryKey: ["jobs", "facets", filters],
    queryFn: () => getFacets(filters),
    placeholderData: keepPreviousData,
  });
}

export function useFeaturedJobs() {
  return useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: () => getFeaturedJobs(8),
    staleTime: 5 * 60_000,
  });
}

export function useJobDetail(id: string) {
  return useQuery({
    queryKey: ["jobs", "detail", id],
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  });
}

export function useSuggestions(query: string, enabled = false) {
  return useQuery({
    queryKey: ["search", "suggestions", query],
    queryFn: () => getSuggestions(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/* Job management (poster)                                             */
/* ------------------------------------------------------------------ */

export function useMyJobs(params: MyJobsQueryParams) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "jobs", params],
    queryFn: () => getMyJobs(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useJobStats(id: string | undefined) {
  return useQuery({
    queryKey: ["employer", "jobs", "stats", id],
    queryFn: () => fetchJobStats(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Fetches a single owned job across all statuses. The employer routes have
 * no "get my job by id" endpoint, so the 5 status lists are merged client-side.
 */
export function useMyJobById(id: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "jobs", "by-id", id],
    queryFn: async () => {
      const statuses: JobStatus[] = ["draft", "published", "closed", "expired", "archived"];
      const results = await Promise.all(
        statuses.map((jobStatus) => getMyJobs({ status: jobStatus, limit: 100 })),
      );
      for (const result of results) {
        const found = result.data.find((job) => job._id === id);
        if (found) return found;
      }
      throw new Error("Job not found");
    },
    enabled: status === "authenticated" && Boolean(id),
  });
}

/** Every owned job across all statuses (merge of the per-status lists). */
export function useAllMyJobs() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "jobs", "all"],
    queryFn: async () => {
      const statuses: JobStatus[] = ["draft", "published", "closed", "expired", "archived"];
      const results = await Promise.all(
        statuses.map((jobStatus) => getMyJobs({ status: jobStatus, limit: 100 })),
      );
      return results.flatMap((result) => result.data);
    },
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export type { EmployerJob };

function invalidateJobQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["employer", "jobs"] });
  queryClient.invalidateQueries({ queryKey: ["employer", "dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["jobs", "search"] });
  queryClient.invalidateQueries({ queryKey: ["jobs", "detail"] });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: JobInput) => createJob(input),
    onSuccess: (_data, variables) => {
      invalidateJobQueries(queryClient);
      toast(
        "success",
        variables.status === "published" ? "Job published" : "Job saved as draft",
        variables.status === "published"
          ? "Your job is now live and accepting applications."
          : "You can publish it from My Jobs when it's ready.",
      );
    },
    onError: (error) => {
      toast("error", "Could not create job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<JobInput> }) => updateJob(id, input),
    onSuccess: () => {
      invalidateJobQueries(queryClient);
      toast("success", "Job updated");
    },
    onError: (error) => {
      toast("error", "Could not update job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      invalidateJobQueries(queryClient);
      toast("success", "Job deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function usePublishJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => publishJob(id),
    onSuccess: () => {
      invalidateJobQueries(queryClient);
      toast("success", "Job published", "It's now live and accepting applications.");
    },
    onError: (error) => {
      toast("error", "Could not publish job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => closeJob(id),
    onSuccess: () => {
      invalidateJobQueries(queryClient);
      toast("success", "Job closed", "No new applications will be accepted.");
    },
    onError: (error) => {
      toast("error", "Could not close job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useArchiveJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => archiveJob(id),
    onSuccess: () => {
      invalidateJobQueries(queryClient);
      toast("success", "Job archived");
    },
    onError: (error) => {
      toast("error", "Could not archive job", error instanceof Error ? error.message : undefined);
    },
  });
}

/**
 * Status filter options for the My Jobs list. The backend scopes to one
 * status per request (it defaults to `published`), so there is no "all"
 * mode — the tabs explicitly match each status.
 */
export const myJobStatusOptions: Array<{ value: JobStatus; label: string }> = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
  { value: "expired", label: "Expired" },
];