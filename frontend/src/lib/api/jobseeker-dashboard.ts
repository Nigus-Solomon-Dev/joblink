import type {
  ActivityHeatmapResponse,
  ApplicationStatus,
  ApplicationTimelineResponse,
  JobListItem,
  ProfileCompletenessResponse,
  RecommendedJobsResponse,
  SalaryInsightsResponse,
  SeekerDashboardStats,
  SkillGapResponse,
  MyApplicationListItem,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export async function getDashboardStats(): Promise<SeekerDashboardStats> {
  return unwrap<SeekerDashboardStats>(await http.get("/jobseeker/dashboard/stats"));
}

export interface DashboardApplicationsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: ApplicationStatus;
}

export async function getDashboardApplications(
  params: DashboardApplicationsQueryParams = {},
): Promise<Paginated<MyApplicationListItem>> {
  return unwrapPaginated<MyApplicationListItem>(
    await http.get("/jobseeker/dashboard/applications", { params: { ...params } }),
  );
}

export interface DashboardSavedJobsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  search?: string;
}

export async function getDashboardSavedJobs(
  params: DashboardSavedJobsQueryParams = {},
): Promise<Paginated<JobListItem>> {
  return unwrapPaginated<JobListItem>(
    await http.get("/jobseeker/dashboard/saved-jobs", { params: { ...params } }),
  );
}

export async function getRecommendedJobs(limit = 10): Promise<RecommendedJobsResponse> {
  return unwrap<RecommendedJobsResponse>(
    await http.get("/jobseeker/dashboard/recommended-jobs", { params: { limit } }),
  );
}

export async function getApplicationTimeline(): Promise<ApplicationTimelineResponse> {
  return unwrap<ApplicationTimelineResponse>(
    await http.get("/jobseeker/dashboard/application-timeline"),
  );
}

export async function getSkillGapAnalysis(): Promise<SkillGapResponse> {
  return unwrap<SkillGapResponse>(await http.get("/jobseeker/dashboard/skill-gap"));
}

export async function getSalaryInsights(): Promise<SalaryInsightsResponse> {
  return unwrap<SalaryInsightsResponse>(await http.get("/jobseeker/dashboard/salary-insights"));
}

export async function getActivityHeatmap(): Promise<ActivityHeatmapResponse> {
  return unwrap<ActivityHeatmapResponse>(await http.get("/jobseeker/dashboard/activity-heatmap"));
}

export async function getProfileCompleteness(): Promise<ProfileCompletenessResponse> {
  return unwrap<ProfileCompletenessResponse>(
    await http.get("/jobseeker/dashboard/profile-completeness"),
  );
}
