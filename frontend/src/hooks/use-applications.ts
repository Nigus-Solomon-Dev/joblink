"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  acceptOffer,
  applyToJob,
  bulkUpdateApplicationStatus,
  getCompanyApplicationStats,
  getCompanyApplications,
  getJobApplications,
  getMyApplications,
  getMyApplicationsPage,
  makeOffer,
  scheduleInterview,
  updateApplicationStatus,
  withdrawApplication,
  type ApplyPayload,
  type EmployerApplicationsQueryParams,
  type MyApplicationsQueryParams,
} from "@/lib/api/applications";
import type { ApplicationStatus, InterviewInput, OfferInput } from "@/types";

/** Paginated pipe — revalidates every employer application query. */
function invalidateEmployerApplicationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["employer", "applications"] });
  queryClient.invalidateQueries({ queryKey: ["employer", "dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["employer", "jobs", "stats"] });
  queryClient.invalidateQueries({ queryKey: ["applications", "company"] });
  queryClient.invalidateQueries({ queryKey: ["applications", "job"] });
}

/** Job ids the current user has already applied to (paginates past the 100-row cap). */
export function useAppliedJobIds() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["applications", "mine", "ids"],
    queryFn: async () => {
      const ids = new Set<string>();
      let page = 1;
      while (true) {
        const result = await getMyApplications({ page, limit: 100 });
        for (const application of result.data) {
          const ref = application.jobId ?? application.job;
          const id = typeof ref === "object" && ref ? ref._id : undefined;
          if (id) ids.add(String(id));
        }
        if (page >= result.meta.totalPages || result.data.length === 0) break;
        page += 1;
      }
      return ids;
    },
    enabled: status === "authenticated",
    staleTime: 60_000,
  });
}

export function useApply(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplyPayload) => applyToJob(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine", "ids"] });
    },
  });
}

export function useMyApplicationsPage(params: MyApplicationsQueryParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["applications", "mine", params],
    queryFn: () => getMyApplicationsPage(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason?: string }) =>
      withdrawApplication(applicationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobseeker", "dashboard"] });
      toast("success", "Application withdrawn");
    },
    onError: (error) => {
      toast("error", "Could not withdraw", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (applicationId: string) => acceptOffer(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["jobseeker", "dashboard"] });
      toast("success", "Offer accepted", "Congratulations — the company will be in touch.");
    },
    onError: (error) => {
      toast("error", "Could not accept offer", error instanceof Error ? error.message : undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Employer-side                                                       */
/* ------------------------------------------------------------------ */

export function useCompanyApplications(
  companyId: string | undefined,
  params: EmployerApplicationsQueryParams = {},
) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "applications", "company", companyId, params],
    queryFn: () => getCompanyApplications(companyId as string, params),
    enabled: status === "authenticated" && Boolean(companyId),
    placeholderData: keepPreviousData,
  });
}

export function useJobApplications(
  jobId: string | undefined,
  params: EmployerApplicationsQueryParams = {},
) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "applications", "job", jobId, params],
    queryFn: () => getJobApplications(jobId as string, params),
    enabled: status === "authenticated" && Boolean(jobId),
    placeholderData: keepPreviousData,
  });
}

export function useCompanyApplicationStats(companyId: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "applications", "company", companyId, "stats"],
    queryFn: () => getCompanyApplicationStats(companyId as string),
    enabled: status === "authenticated" && Boolean(companyId),
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, status, notes }: { applicationId: string; status: ApplicationStatus; notes?: string }) =>
      updateApplicationStatus(applicationId, { status, notes }),
    onSuccess: (_data, variables) => {
      invalidateEmployerApplicationQueries(queryClient);
      toast("success", "Application updated", `${variables.status.replaceAll("_", " ")}`);
    },
    onError: (error) => {
      toast("error", "Could not update application", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, details }: { applicationId: string; details: InterviewInput }) =>
      scheduleInterview(applicationId, details),
    onSuccess: () => {
      invalidateEmployerApplicationQueries(queryClient);
      toast("success", "Interview scheduled");
    },
    onError: (error) => {
      toast("error", "Could not schedule interview", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useMakeOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ applicationId, details }: { applicationId: string; details: OfferInput }) =>
      makeOffer(applicationId, details),
    onSuccess: () => {
      invalidateEmployerApplicationQueries(queryClient);
      toast("success", "Offer sent", "The applicant has been notified.");
    },
    onError: (error) => {
      toast("error", "Could not send offer", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useBulkUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      applicationIds,
      status,
      notes,
    }: {
      applicationIds: string[];
      status: ApplicationStatus;
      notes?: string;
    }) => bulkUpdateApplicationStatus({ applicationIds, status, notes }),
    onSuccess: () => {
      invalidateEmployerApplicationQueries(queryClient);
      toast("success", "Bulk update complete", "Applicants have been notified.");
    },
    onError: (error) => {
      toast("error", "Bulk update failed", error instanceof Error ? error.message : undefined);
    },
  });
}