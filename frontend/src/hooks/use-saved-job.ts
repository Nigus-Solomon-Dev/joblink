"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { savedJobsApi } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { JobListItem } from "@/types";

export function useIsSaved(jobId: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["saved", "is-saved", jobId],
    queryFn: () => savedJobsApi.isJobSaved(jobId),
    enabled: status === "authenticated" && Boolean(jobId),
    staleTime: 30_000,
  });
}

export function useSaveJobToggle(jobId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { status } = useAuth();
  const { toast } = useToast();

  const isSavedQuery = useIsSaved(jobId);
  const isSaved = isSavedQuery.data?.isSaved ?? false;

  const mutation = useMutation({
    mutationFn: (nextState: boolean) =>
      nextState ? savedJobsApi.saveJob(jobId) : savedJobsApi.unsaveJob(jobId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["saved", "is-saved", jobId] });
      queryClient.setQueryData(["saved", "is-saved", jobId], { isSaved: !isSaved });
    },
    onError: () => {
      queryClient.setQueryData(["saved", "is-saved", jobId], { isSaved });
      queryClient.invalidateQueries({ queryKey: ["saved", "is-saved", jobId] });
      toast("error", "Something went wrong", "Please try again.");
    },
    onSuccess: (_data, nextState) => {
      if (!nextState) {
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
      }
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobseeker", "dashboard"] });
      toast("success", nextState ? "Job saved" : "Removed from saved jobs");
    },
  });

  const toggle = () => {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
      return;
    }
    if (!mutation.isPending) mutation.mutate(!isSaved);
  };

  return {
    isSaved,
    loading: isSavedQuery.isLoading,
    toggling: mutation.isPending,
    toggle,
  };
}