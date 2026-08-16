"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import {
  getActivityHeatmap,
  getApplicationTimeline,
  getDashboardApplications,
  getDashboardSavedJobs,
  getDashboardStats,
  getProfileCompleteness,
  getRecommendedJobs,
  getSalaryInsights,
  getSkillGapAnalysis,
  type DashboardApplicationsQueryParams,
  type DashboardSavedJobsQueryParams,
} from "@/lib/api/jobseeker-dashboard";

export function useDashboardStats() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "stats"],
    queryFn: () => getDashboardStats(),
    enabled: status === "authenticated",
  });
}

export function useDashboardApplications(params: DashboardApplicationsQueryParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "applications", params],
    queryFn: () => getDashboardApplications(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useDashboardSavedJobs(params: DashboardSavedJobsQueryParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "saved-jobs", params],
    queryFn: () => getDashboardSavedJobs(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useRecommendedJobs(limit = 6) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "recommended-jobs", limit],
    queryFn: () => getRecommendedJobs(limit),
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
  });
}

export function useApplicationTimeline() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "application-timeline"],
    queryFn: () => getApplicationTimeline(),
    enabled: status === "authenticated",
  });
}

export function useSkillGap() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "skill-gap"],
    queryFn: () => getSkillGapAnalysis(),
    enabled: status === "authenticated",
  });
}

export function useSalaryInsights() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "salary-insights"],
    queryFn: () => getSalaryInsights(),
    enabled: status === "authenticated",
  });
}

export function useActivityHeatmap() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "activity-heatmap"],
    queryFn: () => getActivityHeatmap(),
    enabled: status === "authenticated",
  });
}

export function useProfileCompleteness() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["jobseeker", "dashboard", "profile-completeness"],
    queryFn: () => getProfileCompleteness(),
    enabled: status === "authenticated",
  });
}