import type { User } from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrapPaginated } from "./http";

/** A lightweight user entry returned by `GET /users/search`. */
export type UserSummary = Pick<User, "_id" | "name" | "email" | "avatar" | "role" | "location">;

/** `GET /users/search?q=` — find active users by name/email/location to message. */
export async function searchUsers(
  query: string,
  params: { page?: number; limit?: number } = {},
): Promise<Paginated<UserSummary>> {
  return unwrapPaginated<UserSummary>(
    await http.get("/users/search", {
      params: { q: query, page: params.page || undefined, limit: params.limit || undefined },
    }),
  );
}