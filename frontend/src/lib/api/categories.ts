import type { Category, Skill } from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

/** `{ [categoryName]: Skill[] }` — mirror of `GET /skills/grouped`. */
export type SkillGroups = Record<string, Skill[]>;

export async function getCategoriesWithJobs(): Promise<{ categories: Category[] }> {
  return unwrap<{ categories: Category[] }>(await http.get("/categories/with-jobs"));
}

export async function getCategories(): Promise<Category[]> {
  const result = await unwrap<Category[]>(await http.get("/categories"));
  return Array.isArray(result) ? result : [];
}

/** `GET /skills` — flat, paginated skill list (used by the job form picker). */
export async function getAllSkills(
  params: Partial<{ page: number; limit: number; search?: string; category?: string }> = {},
): Promise<Paginated<Skill>> {
  return unwrapPaginated<Skill>(
    await http.get("/skills", {
      params: { page: params.page, limit: params.limit, search: params.search || undefined, category: params.category || undefined },
    }),
  );
}

export async function getSkillsGrouped(): Promise<{ skills: SkillGroups }> {
  return unwrap<{ skills: SkillGroups }>(await http.get("/skills/grouped"));
}

export async function getTopSkills(limit = 20): Promise<{ skills: Skill[] }> {
  return unwrap<{ skills: Skill[] }>(
    await http.get("/skills/top", { params: { limit } }),
  );
}
