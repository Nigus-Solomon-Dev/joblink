"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/lib/api";

export function useCategoriesWithJobs() {
  return useQuery({
    queryKey: ["categories", "with-jobs"],
    queryFn: () => categoriesApi.getCategoriesWithJobs(),
    staleTime: 5 * 60_000,
  });
}

export function useSkillsGrouped() {
  return useQuery({
    queryKey: ["skills", "grouped"],
    queryFn: () => categoriesApi.getSkillsGrouped(),
    staleTime: 5 * 60_000,
  });
}

export function useTopSkills(limit = 12) {
  return useQuery({
    queryKey: ["skills", "top", limit],
    queryFn: () => categoriesApi.getTopSkills(limit),
    staleTime: 5 * 60_000,
  });
}

/** Full skills catalogue used by the job form picker. */
export function useAllSkills(limit = 200) {
  return useQuery({
    queryKey: ["skills", "all", limit],
    queryFn: () => categoriesApi.getAllSkills({ limit }),
    staleTime: 5 * 60_000,
  });
}

/** All active categories for the job form's category select. */
export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 5 * 60_000,
  });
}