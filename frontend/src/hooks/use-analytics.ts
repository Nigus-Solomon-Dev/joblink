"use client";

import { useQuery } from "@tanstack/react-query";

import { getCompanyPerformance } from "@/lib/api/analytics";

export function useCompanyPerformance(companyId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "company", "performance", companyId],
    queryFn: () => getCompanyPerformance(companyId as string),
    enabled: Boolean(companyId),
  });
}