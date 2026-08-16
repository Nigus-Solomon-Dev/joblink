import type {
  AddCompanyMemberInput,
  Company,
  CompanyMemberRole,
  CompanySize,
  CompanyStats,
  CompanyUpdateInput,
  CompanyWithStats,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export interface CompanyQueryParams {
  search?: string;
  industry?: string;
  size?: CompanySize;
  location?: string;
  isVerified?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function getCompanies(
  params: CompanyQueryParams = {},
): Promise<Paginated<Company>> {
  return unwrapPaginated<Company>(
    await http.get("/companies", { params: { ...params } }),
  );
}

export async function getCompanyBySlug(slug: string): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.get(`/companies/slug/${encodeURIComponent(slug)}`),
  );
}

/** `GET /companies/:id` (requires auth for the owner view). */
export async function getCompanyById(id: string): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.get(`/companies/${encodeURIComponent(id)}`),
  );
}

/** `GET /companies/:id/stats` (protected). */
export async function getCompanyStats(id: string): Promise<CompanyStats> {
  return unwrap<CompanyStats>(
    await http.get(`/companies/${encodeURIComponent(id)}/stats`),
  );
}

/* ------------------------------------------------------------------ */
/* Company management (owner)                                          */
/* ------------------------------------------------------------------ */

/** `GET /companies/my-companies` */
export async function getMyCompanies(): Promise<{ companies: CompanyWithStats[] }> {
  return unwrap<{ companies: CompanyWithStats[] }>(
    await http.get("/companies/my-companies"),
  );
}

/** `POST /companies` — exactly one company per user (backend enforces). */
export async function createCompany(
  input: CompanyUpdateInput,
): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(await http.post("/companies", input));
}

/** `PATCH /companies/:id` */
export async function updateCompany(
  id: string,
  input: CompanyUpdateInput,
): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.patch(`/companies/${encodeURIComponent(id)}`, input),
  );
}

/** `DELETE /companies/:id` (owner only). */
export async function deleteCompany(id: string): Promise<void> {
  await http.delete(`/companies/${encodeURIComponent(id)}`);
}

/** `POST /companies/:id/logo` (multipart field `logo`). */
export async function uploadCompanyLogo(
  id: string,
  file: File,
): Promise<{ company: Company }> {
  const formData = new FormData();
  formData.append("logo", file);
  return unwrap<{ company: Company }>(
    await http.post(`/companies/${encodeURIComponent(id)}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

/** `POST /companies/:id/cover` (multipart field `coverImage`). */
export async function uploadCompanyCover(
  id: string,
  file: File,
): Promise<{ company: Company }> {
  const formData = new FormData();
  formData.append("coverImage", file);
  return unwrap<{ company: Company }>(
    await http.post(`/companies/${encodeURIComponent(id)}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Member management                                                   */
/* ------------------------------------------------------------------ */

/** `POST /companies/:id/members` */
export async function addCompanyMember(
  id: string,
  input: AddCompanyMemberInput,
): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.post(`/companies/${encodeURIComponent(id)}/members`, input),
  );
}

/** `DELETE /companies/:id/members/:memberId` */
export async function removeCompanyMember(
  id: string,
  memberId: string,
): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.delete(
      `/companies/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
    ),
  );
}

/** `PATCH /companies/:id/members/:memberId` (owner only). */
export async function updateCompanyMemberRole(
  id: string,
  memberId: string,
  role: Extract<CompanyMemberRole, "admin" | "recruiter" | "viewer">,
): Promise<{ company: Company }> {
  return unwrap<{ company: Company }>(
    await http.patch(
      `/companies/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`,
      { role },
    ),
  );
}
