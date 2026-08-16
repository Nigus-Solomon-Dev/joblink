import type {
  AdminCompanyAnalytics,
  AdminCompanyItem,
  AdminFeatureJobInput,
  AdminJobAnalytics,
  AdminJobItem,
  AdminRevenueAnalytics,
  AdminSettings,
  AdminSystemHealth,
  AdminSystemOverview,
  AdminUserAnalytics,
  AdminUserItem,
  AdminUserStats,
  AdminUserUpdateInput,
  AdminVerifyCompanyInput,
  AuditLogEntry,
  CategoryInput,
  CompanyUpdateInput,
  CustomReportResponse,
  EmailAnalytics,
  EmailQueueStatus,
  FunnelResponse,
  JobInput,
  MarketTrendResponse,
  ReportDateRange,
  ReportGroupBy,
  ReportType,
  RealtimeMetrics,
  ScheduledReportItem,
  SkillInput,
  TelegramBotInfo,
  TelegramBotStatus,
  UserBehaviorResponse,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */

const dashboard = "/admin/dashboard";

export async function getAdminOverview(): Promise<AdminSystemOverview> {
  return unwrap<AdminSystemOverview>(await http.get(`${dashboard}/overview`));
}

export async function getAdminUserAnalytics(
  period: "7d" | "30d" | "90d" | "365d" = "30d",
): Promise<AdminUserAnalytics> {
  return unwrap<AdminUserAnalytics>(
    await http.get(`${dashboard}/analytics/users`, { params: { period } }),
  );
}

export async function getAdminCompanyAnalytics(
  period: "7d" | "30d" | "90d" | "365d" = "30d",
): Promise<AdminCompanyAnalytics> {
  return unwrap<AdminCompanyAnalytics>(
    await http.get(`${dashboard}/analytics/companies`, { params: { period } }),
  );
}

export async function getAdminJobAnalytics(
  period: "7d" | "30d" | "90d" | "365d" = "30d",
): Promise<AdminJobAnalytics> {
  return unwrap<AdminJobAnalytics>(
    await http.get(`${dashboard}/analytics/jobs`, { params: { period } }),
  );
}

export async function getAdminRevenueAnalytics(): Promise<AdminRevenueAnalytics> {
  return unwrap<AdminRevenueAnalytics>(await http.get(`${dashboard}/analytics/revenue`));
}

export async function getSystemHealth(): Promise<AdminSystemHealth> {
  return unwrap<AdminSystemHealth>(await http.get(`${dashboard}/health`));
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(
  params: AuditLogsParams = {},
): Promise<Paginated<AuditLogEntry>> {
  return unwrapPaginated<AuditLogEntry>(
    await http.get(`${dashboard}/audit-logs`, {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        action: params.action || undefined,
        entityType: params.entityType || undefined,
        userId: params.userId || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      },
    }),
  );
}

export async function getAdminSettings(): Promise<AdminSettings> {
  return unwrap<AdminSettings>(await http.get(`${dashboard}/settings`));
}

export async function updateAdminSettings(
  settings: Partial<AdminSettings>,
): Promise<{ success: boolean; message: string; updated: Partial<AdminSettings> }> {
  return unwrap<{ success: boolean; message: string; updated: Partial<AdminSettings> }>(
    await http.patch(`${dashboard}/settings`, settings),
  );
}

/* ------------------------------------------------------------------ */
/* Admin: users                                                        */
/* ------------------------------------------------------------------ */

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
}

export async function getAdminUsers(
  params: AdminUsersParams = {},
): Promise<Paginated<AdminUserItem>> {
  return unwrapPaginated<AdminUserItem>(
    await http.get("/users", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        search: params.search || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        emailVerified: params.emailVerified === undefined ? undefined : String(params.emailVerified),
      },
    }),
  );
}

export async function getAdminUserStats(): Promise<AdminUserStats> {
  return unwrap<AdminUserStats>(await http.get("/users/stats"));
}

export async function updateAdminUser(
  id: string,
  input: AdminUserUpdateInput,
): Promise<{ user: AdminUserItem }> {
  return unwrap<{ user: AdminUserItem }>(await http.patch(`/users/${encodeURIComponent(id)}`, input));
}

export async function deleteAdminUser(id: string): Promise<void> {
  await http.delete(`/users/${encodeURIComponent(id)}`);
}

/* ------------------------------------------------------------------ */
/* Admin: companies                                                    */
/* ------------------------------------------------------------------ */

export interface AdminCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  isVerified?: boolean;
  industry?: string;
  size?: string;
}

export async function getAdminCompanies(
  params: AdminCompaniesParams = {},
): Promise<Paginated<AdminCompanyItem>> {
  return unwrapPaginated<AdminCompanyItem>(
    await http.get("/companies/admin", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        search: params.search || undefined,
        isVerified: params.isVerified === undefined ? undefined : String(params.isVerified),
        industry: params.industry || undefined,
        size: params.size || undefined,
      },
    }),
  );
}

export async function updateAdminCompany(
  id: string,
  input: CompanyUpdateInput,
): Promise<{ company: AdminCompanyItem }> {
  return unwrap<{ company: AdminCompanyItem }>(
    await http.patch(`/companies/admin/${encodeURIComponent(id)}`, input),
  );
}

export async function deleteAdminCompany(id: string): Promise<void> {
  await http.delete(`/companies/admin/${encodeURIComponent(id)}`);
}

export async function verifyAdminCompany(
  id: string,
  input: AdminVerifyCompanyInput,
): Promise<{ company: AdminCompanyItem }> {
  return unwrap<{ company: AdminCompanyItem }>(
    await http.patch(`/companies/admin/${encodeURIComponent(id)}/verify`, input),
  );
}

/* ------------------------------------------------------------------ */
/* Admin: jobs                                                         */
/* ------------------------------------------------------------------ */

export interface AdminJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  featured?: boolean;
  categoryId?: string;
}

export async function getAdminJobs(
  params: AdminJobsParams = {},
): Promise<Paginated<AdminJobItem>> {
  return unwrapPaginated<AdminJobItem>(
    await http.get("/jobs/admin", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        query: params.search || undefined,
        status: params.status || undefined,
        type: params.type || undefined,
        featured: params.featured === undefined ? undefined : String(params.featured),
        categoryId: params.categoryId || undefined,
      },
    }),
  );
}

export async function updateAdminJob(
  id: string,
  input: Partial<JobInput> & { status?: string; featured?: boolean },
): Promise<{ job: AdminJobItem }> {
  return unwrap<{ job: AdminJobItem }>(
    await http.patch(`/jobs/admin/${encodeURIComponent(id)}`, input),
  );
}

export async function deleteAdminJob(id: string): Promise<void> {
  await http.delete(`/jobs/admin/${encodeURIComponent(id)}`);
}

export async function featureAdminJob(
  id: string,
  input: AdminFeatureJobInput,
): Promise<{ job: AdminJobItem }> {
  return unwrap<{ job: AdminJobItem }>(
    await http.patch(`/jobs/admin/${encodeURIComponent(id)}/feature`, input),
  );
}

/* ------------------------------------------------------------------ */
/* Admin: categories & skills                                          */
/* ------------------------------------------------------------------ */

export async function createCategory(input: CategoryInput): Promise<{ category: { _id: string } }> {
  return unwrap<{ category: { _id: string } }>(await http.post("/categories", input));
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<{ category: { _id: string } }> {
  return unwrap<{ category: { _id: string } }>(
    await http.patch(`/categories/${encodeURIComponent(id)}`, input),
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await http.delete(`/categories/${encodeURIComponent(id)}`);
}

export async function createSkill(input: SkillInput): Promise<{ skill: { _id: string } }> {
  return unwrap<{ skill: { _id: string } }>(await http.post("/skills", input));
}

export async function updateSkill(
  id: string,
  input: Partial<SkillInput>,
): Promise<{ skill: { _id: string } }> {
  return unwrap<{ skill: { _id: string } }>(
    await http.patch(`/skills/${encodeURIComponent(id)}`, input),
  );
}

export async function deleteSkill(id: string): Promise<void> {
  await http.delete(`/skills/${encodeURIComponent(id)}`);
}

/* ------------------------------------------------------------------ */
/* Admin: analytics / reports                                          */
/* ------------------------------------------------------------------ */

export async function getUserBehaviorAnalytics(): Promise<UserBehaviorResponse> {
  return unwrap<UserBehaviorResponse>(await http.get("/analytics/user-behavior"));
}

export async function getMarketTrendAnalytics(
  period: "7d" | "30d" | "90d" | "365d" = "90d",
): Promise<MarketTrendResponse> {
  return unwrap<MarketTrendResponse>(
    await http.get("/analytics/market-trends", { params: { period } }),
  );
}

export async function getFunnelAnalytics(): Promise<FunnelResponse> {
  return unwrap<FunnelResponse>(await http.get("/analytics/funnel"));
}

export async function getRealtimeMetrics(): Promise<RealtimeMetrics> {
  return unwrap<RealtimeMetrics>(await http.get("/analytics/realtime"));
}

export interface BuildCustomReportInput {
  reportType: ReportType;
  dateRange?: ReportDateRange;
  filters?: Record<string, unknown>;
  groupBy?: ReportGroupBy;
  metrics?: string[];
}

export async function buildCustomReport(
  input: BuildCustomReportInput,
): Promise<CustomReportResponse> {
  return unwrap<CustomReportResponse>(await http.post("/analytics/reports/custom", input));
}

export async function getScheduledReports(): Promise<ScheduledReportItem[]> {
  const data = await unwrap<unknown>(await http.get("/analytics/reports/scheduled"));
  return (data as ScheduledReportItem[]) ?? [];
}

export async function deleteScheduledReport(id: string): Promise<{ success: boolean }> {
  return unwrap<{ success: boolean }>(
    await http.delete(`/analytics/reports/scheduled/${encodeURIComponent(id)}`),
  );
}

export type ExportFormat = "csv" | "json" | "pdf";

/** Returns a Blob for the requested report export. */
export async function exportReportData(
  reportType: ReportType,
  format: ExportFormat = "csv",
): Promise<Blob> {
  const response = await http.get("/analytics/export", {
    params: { reportType, format },
    responseType: "blob",
  });
  return response.data as Blob;
}

/* ------------------------------------------------------------------ */
/* Admin: email                                                        */
/* ------------------------------------------------------------------ */

export async function getEmailQueueStatus(): Promise<EmailQueueStatus> {
  return unwrap<EmailQueueStatus>(await http.get("/emails/queue"));
}

export async function getEmailAnalytics(): Promise<EmailAnalytics> {
  return unwrap<EmailAnalytics>(await http.get("/emails/analytics"));
}

export async function clearEmailQueue(): Promise<{ success: boolean; message: string }> {
  return unwrap<{ success: boolean; message: string }>(await http.delete("/emails/queue"));
}

export async function sendTestEmail(input: { to: string; subject?: string }): Promise<unknown> {
  return unwrap<unknown>(await http.post("/emails/test", input));
}

/* ------------------------------------------------------------------ */
/* Admin: telegram bot                                                 */
/* ------------------------------------------------------------------ */

export async function getTelegramBotInfo(): Promise<TelegramBotInfo> {
  return unwrap<TelegramBotInfo>(await http.get("/telegram/info"));
}

export async function getTelegramBotStatus(): Promise<TelegramBotStatus> {
  return unwrap<TelegramBotStatus>(await http.get("/telegram/status"));
}

export async function telegramBroadcast(
  message: string,
): Promise<{ success: boolean; message: string }> {
  return unwrap<{ success: boolean; message: string }>(
    await http.post("/telegram/broadcast", { message }),
  );
}

export async function telegramSendToUser(
  userId: string,
  message: string,
): Promise<{ success: boolean; message: string }> {
  return unwrap<{ success: boolean; message: string }>(
    await http.post("/telegram/send", { userId, message }),
  );
}

export async function telegramSendJobAlert(
  userId: string,
  jobId: string,
): Promise<{ success: boolean; message: string }> {
  return unwrap<{ success: boolean; message: string }>(
    await http.post("/telegram/job-alert", { userId, jobId }),
  );
}
