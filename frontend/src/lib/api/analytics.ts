import type { CompanyPerformanceMetrics } from "@/types";

import { http, unwrap } from "./http";

/** `GET /analytics/company/:companyId/performance` */
export async function getCompanyPerformance(
  companyId: string,
): Promise<CompanyPerformanceMetrics> {
  return unwrap<CompanyPerformanceMetrics>(
    await http.get(`/analytics/company/${encodeURIComponent(companyId)}/performance`),
  );
}
