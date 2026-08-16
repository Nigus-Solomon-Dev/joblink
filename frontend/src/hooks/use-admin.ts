"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { adminApi, categoriesApi } from "@/lib/api";
import type { BuildCustomReportInput } from "@/lib/api/admin";
import type {
  AdminSettings,
  AdminUserUpdateInput,
  CategoryInput,
  CompanyUpdateInput,
  JobInput,
  SkillInput,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */

export function useAdminOverview() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: () => adminApi.getAdminOverview(),
    enabled: status === "authenticated",
  });
}

export function useAdminUserAnalytics(period: "7d" | "30d" | "90d" | "365d" = "30d") {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "dashboard", "analytics", "users", period],
    queryFn: () => adminApi.getAdminUserAnalytics(period),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useAdminCompanyAnalytics(period: "7d" | "30d" | "90d" | "365d" = "30d") {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "dashboard", "analytics", "companies", period],
    queryFn: () => adminApi.getAdminCompanyAnalytics(period),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useAdminJobAnalytics(period: "7d" | "30d" | "90d" | "365d" = "30d") {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "dashboard", "analytics", "jobs", period],
    queryFn: () => adminApi.getAdminJobAnalytics(period),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useAdminRevenueAnalytics() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "dashboard", "analytics", "revenue"],
    queryFn: () => adminApi.getAdminRevenueAnalytics(),
    enabled: status === "authenticated",
  });
}

export function useSystemHealth() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminApi.getSystemHealth(),
    enabled: status === "authenticated",
    refetchInterval: 120_000,
  });
}

export function useAuditLogs(data: adminApi.AuditLogsParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "audit-logs", data],
    queryFn: () => adminApi.getAuditLogs(data),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useAdminSettings() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.getAdminSettings(),
    enabled: status === "authenticated",
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (settings: Partial<AdminSettings>) => adminApi.updateAdminSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast("success", "Settings saved");
    },
    onError: (error) => {
      toast("error", "Could not save settings", error instanceof Error ? error.message : undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin: users                                                        */
/* ------------------------------------------------------------------ */

function invalidateAdminUsers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "users", "stats"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
}

export function useAdminUsers(params: adminApi.AdminUsersParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.getAdminUsers(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserStats() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "users", "stats"],
    queryFn: () => adminApi.getAdminUserStats(),
    enabled: status === "authenticated",
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUserUpdateInput }) =>
      adminApi.updateAdminUser(id, input),
    onSuccess: () => {
      invalidateAdminUsers(queryClient);
      toast("success", "User updated");
    },
    onError: (error) => {
      toast("error", "Could not update user", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminUser(id),
    onSuccess: () => {
      invalidateAdminUsers(queryClient);
      toast("success", "User deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete user", error instanceof Error ? error.message : undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin: companies                                                    */
/* ------------------------------------------------------------------ */

function invalidateAdminCompanies(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
}

export function useAdminCompanies(params: adminApi.AdminCompaniesParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "companies", params],
    queryFn: () => adminApi.getAdminCompanies(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useVerifyAdminCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminApi.verifyAdminCompany(id, { isVerified }),
    onSuccess: () => {
      invalidateAdminCompanies(queryClient);
      toast("success", "Verification updated");
    },
    onError: (error) => {
      toast("error", "Could not update verification", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateAdminCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompanyUpdateInput }) =>
      adminApi.updateAdminCompany(id, input),
    onSuccess: () => {
      invalidateAdminCompanies(queryClient);
      toast("success", "Company updated");
    },
    onError: (error) => {
      toast("error", "Could not update company", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteAdminCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminCompany(id),
    onSuccess: () => {
      invalidateAdminCompanies(queryClient);
      toast("success", "Company deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete company", error instanceof Error ? error.message : undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin: jobs                                                         */
/* ------------------------------------------------------------------ */

function invalidateAdminJobs(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["jobs"] });
}

export function useAdminJobs(params: adminApi.AdminJobsParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "jobs", params],
    queryFn: () => adminApi.getAdminJobs(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useFeatureAdminJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      adminApi.featureAdminJob(id, { featured }),
    onSuccess: () => {
      invalidateAdminJobs(queryClient);
      toast("success", "Featured status updated");
    },
    onError: (error) => {
      toast("error", "Could not update featured status", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateAdminJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<JobInput> & { status?: string; featured?: boolean } }) =>
      adminApi.updateAdminJob(id, input),
    onSuccess: () => {
      invalidateAdminJobs(queryClient);
      toast("success", "Job updated");
    },
    onError: (error) => {
      toast("error", "Could not update job", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteAdminJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminJob(id),
    onSuccess: () => {
      invalidateAdminJobs(queryClient);
      toast("success", "Job deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete job", error instanceof Error ? error.message : undefined);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Admin: categories & skills                                          */
/* ------------------------------------------------------------------ */

export function useAdminCategoryMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };
  const onError = (error: unknown) =>
    toast("error", "Category action failed", error instanceof Error ? error.message : undefined);

  const create = useMutation({
    mutationFn: (input: CategoryInput) => adminApi.createCategory(input),
    onSuccess: () => {
      invalidate();
      toast("success", "Category created");
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      adminApi.updateCategory(id, input),
    onSuccess: () => {
      invalidate();
      toast("success", "Category updated");
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      invalidate();
      toast("success", "Category deleted");
    },
    onError,
  });

  return { create, update, remove };
}

export function useAdminSkillMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["skills"] });
  };
  const onError = (error: unknown) =>
    toast("error", "Skill action failed", error instanceof Error ? error.message : undefined);

  const create = useMutation({
    mutationFn: (input: SkillInput) => adminApi.createSkill(input),
    onSuccess: () => {
      invalidate();
      toast("success", "Skill created");
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SkillInput> }) =>
      adminApi.updateSkill(id, input),
    onSuccess: () => {
      invalidate();
      toast("success", "Skill updated");
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteSkill(id),
    onSuccess: () => {
      invalidate();
      toast("success", "Skill deleted");
    },
    onError,
  });

  return { create, update, remove };
}

/** All categories (for navigation + skill grouping). */
export function useAdminCategoriesForManage() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "categories", "manage"],
    queryFn: () => categoriesApi.getCategories(),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/* Admin: analytics / reports / email / telegram                       */
/* ------------------------------------------------------------------ */

export function useMarketTrendAnalytics(period: "7d" | "30d" | "90d" | "365d" = "90d") {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "analytics", "market", period],
    queryFn: () => adminApi.getMarketTrendAnalytics(period),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useUserBehaviorAnalytics() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "analytics", "behavior"],
    queryFn: () => adminApi.getUserBehaviorAnalytics(),
    enabled: status === "authenticated",
  });
}

export function useFunnelAnalytics() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "analytics", "funnel"],
    queryFn: () => adminApi.getFunnelAnalytics(),
    enabled: status === "authenticated",
  });
}

export function useRealtimeMetrics() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "analytics", "realtime"],
    queryFn: () => adminApi.getRealtimeMetrics(),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
}

export function useBuildCustomReport() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: BuildCustomReportInput) => adminApi.buildCustomReport(input),
    onError: (error) => {
      toast("error", "Could not generate report", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useScheduledReports() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "reports", "scheduled"],
    queryFn: () => adminApi.getScheduledReports(),
    enabled: status === "authenticated",
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteScheduledReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports", "scheduled"] });
      toast("success", "Report deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete report", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useEmailQueueStatus() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "email", "queue"],
    queryFn: () => adminApi.getEmailQueueStatus(),
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });
}

export function useEmailAnalytics() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "email", "analytics"],
    queryFn: () => adminApi.getEmailAnalytics(),
    enabled: status === "authenticated",
  });
}

export function useClearEmailQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => adminApi.clearEmailQueue(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email", "queue"] });
      toast("success", "Queue cleared");
    },
    onError: (error) => {
      toast("error", "Could not clear queue", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useSendTestEmail() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: { to: string; subject?: string }) => adminApi.sendTestEmail(input),
    onSuccess: () => {
      toast("success", "Test email sent");
    },
    onError: (error) => {
      toast("error", "Could not send test email", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useTelegramBotInfo() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "telegram", "info"],
    queryFn: () => adminApi.getTelegramBotInfo(),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
}

export function useTelegramBotStatus() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["admin", "telegram", "status"],
    queryFn: () => adminApi.getTelegramBotStatus(),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
}

export function useTelegramBroadcast() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (message: string) => adminApi.telegramBroadcast(message),
    onSuccess: () => {
      toast("success", "Broadcast sent");
    },
    onError: (error) => {
      toast("error", "Broadcast failed", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useTelegramSendToUser() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      adminApi.telegramSendToUser(userId, message),
    onSuccess: () => {
      toast("success", "Message sent");
    },
    onError: (error) => {
      toast("error", "Could not send message", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useTelegramSendJobAlert() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ userId, jobId }: { userId: string; jobId: string }) =>
      adminApi.telegramSendJobAlert(userId, jobId),
    onSuccess: () => {
      toast("success", "Job alert sent");
    },
    onError: (error) => {
      toast("error", "Could not send job alert", error instanceof Error ? error.message : undefined);
    },
  });
}