"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { savedJobsApi } from "@/lib/api";

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