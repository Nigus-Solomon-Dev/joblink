import type { User } from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

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

export interface TelegramLinkCode {
  code: string;
  expiresAt: string;
}

/** `POST /users/me/telegram/link` — generate a fresh one-time bot link code. */
export async function generateTelegramLinkCode(): Promise<TelegramLinkCode> {
  return unwrap<TelegramLinkCode>(await http.post("/users/me/telegram/link"));
}

/** `DELETE /users/me/telegram/link` — disconnect the Telegram account. */
export async function unlinkTelegram(): Promise<{ user: User }> {
  return unwrap<{ user: User }>(await http.delete("/users/me/telegram/link"));
}