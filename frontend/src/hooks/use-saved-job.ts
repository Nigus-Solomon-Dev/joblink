"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { savedJobsApi } from "@/lib/api";

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
      toast("error", "Something went wrong", "Please try again.");
    },
    onSuccess: (_data, nextState) => {
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
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