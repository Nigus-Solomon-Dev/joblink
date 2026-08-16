"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import {
  getCompanyTeam,
  getEmployerAnalytics,
  getEmployerApplications,
  getEmployerCompanies,
  getEmployerStats,
  getSubscription,
  type EmployerApplicationPipelineParams,
} from "@/lib/api/employer-dashboard";
import type { AnalyticsPeriod } from "@/types";

export function useEmployerStats() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "stats"],
    queryFn: () => getEmployerStats(),
    enabled: status === "authenticated",
  });
}

export function useEmployerAnalytics(period: AnalyticsPeriod = "30d") {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "analytics", period],
    queryFn: () => getEmployerAnalytics(period),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useEmployerApplications(params: EmployerApplicationPipelineParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "applications", params],
    queryFn: () => getEmployerApplications(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useEmployerCompanies() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "companies"],
    queryFn: () => getEmployerCompanies(),
    enabled: status === "authenticated",
  });
}

export function useCompanyTeam(companyId: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "team", companyId],
    queryFn: () => getCompanyTeam(companyId as string),
    enabled: status === "authenticated" && Boolean(companyId),
  });
}

export function useSubscription() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["employer", "dashboard", "subscription"],
    queryFn: () => getSubscription(),
    enabled: status === "authenticated",
  });
}