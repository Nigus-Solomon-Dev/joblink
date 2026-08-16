import type {
  AnalyticsPeriod,
  ApplicationStatus,
  CompanyTeamMember,
  CompanyWithStats,
  EmployerAnalytics,
  EmployerApplicationListItem,
  EmployerDashboardStats,
  SubscriptionResponse,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export interface EmployerApplicationPipelineParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  jobId?: string;
}

/** `GET /employer/dashboard/stats` */
export async function getEmployerStats(): Promise<EmployerDashboardStats> {
  return unwrap<EmployerDashboardStats>(
    await http.get("/employer/dashboard/stats"),
  );
}

/** `GET /employer/dashboard/analytics?period=` */
export async function getEmployerAnalytics(
  period: AnalyticsPeriod = "30d",
): Promise<EmployerAnalytics> {
  return unwrap<EmployerAnalytics>(
    await http.get("/employer/dashboard/analytics", { params: { period } }),
  );
}

/** `GET /employer/dashboard/applications` (pipeline across the user's companies). */
export async function getEmployerApplications(
  params: EmployerApplicationPipelineParams = {},
): Promise<Paginated<EmployerApplicationListItem>> {
  return unwrapPaginated<EmployerApplicationListItem>(
    await http.get("/employer/dashboard/applications", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        status: params.status || undefined,
        jobId: params.jobId || undefined,
      },
    }),
  );
}

/** `GET /employer/dashboard/companies` (company overview with enrichment stats). */
export async function getEmployerCompanies(): Promise<{ companies: CompanyWithStats[] }> {
  return unwrap<{ companies: CompanyWithStats[] }>(
    await http.get("/employer/dashboard/companies"),
  );
}

/** `GET /employer/dashboard/company/:companyId/team` */
export async function getCompanyTeam(
  companyId: string,
): Promise<{ members: CompanyTeamMember[] }> {
  return unwrap<{ members: CompanyTeamMember[] }>(
    await http.get(`/employer/dashboard/company/${encodeURIComponent(companyId)}/team`),
  );
}

/** `GET /employer/dashboard/subscription` */
export async function getSubscription(): Promise<SubscriptionResponse> {
  return unwrap<SubscriptionResponse>(
    await http.get("/employer/dashboard/subscription"),
  );
}
