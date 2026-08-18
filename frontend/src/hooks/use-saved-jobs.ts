"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { savedJobsApi } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { JobListItem } from "@/types";

export interface SavedJobsQuery {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  search?: string;
}

export function useSavedJobs(params: SavedJobsQuery = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["saved-jobs", params],
    queryFn: () => savedJobsApi.getSavedJobs(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useUnsaveJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (jobId: string) => savedJobsApi.unsaveJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.setQueriesData<Paginated<JobListItem>>(
        { queryKey: ["saved-jobs"] },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter((job) => job._id !== jobId),
                meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
              }
            : old,
      );
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["saved", "is-saved", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobseeker", "dashboard"] });
      toast("success", "Removed from saved jobs");
    },
    onError: (error) => {
      toast("error", "Could not unsave", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateSavedJobNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ jobId, notes }: { jobId: string; notes: string }) =>
      savedJobsApi.updateSavedJobNotes(jobId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      toast("success", "Note saved");
    },
    onError: (error) => {
      toast("error", "Could not save note", error instanceof Error ? error.message : undefined);
    },
  });
}