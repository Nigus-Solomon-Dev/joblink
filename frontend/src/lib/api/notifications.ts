import type {
  AppNotification,
  NotificationPreferencesResponse,
  NotificationType,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  type?: NotificationType;
  isRead?: "true" | "false";
  priority?: "low" | "normal" | "high" | "urgent";
}

export async function getNotifications(
  params: NotificationsQueryParams = {},
): Promise<Paginated<AppNotification>> {
  return unwrapPaginated<AppNotification>(
    await http.get("/notifications", { params: { ...params } }),
  );
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return unwrap<{ count: number }>(await http.get("/notifications/unread-count"));
}

export async function markAsRead(notificationId: string): Promise<{ notification: AppNotification }> {
  return unwrap<{ notification: AppNotification }>(
    await http.patch(`/notifications/${encodeURIComponent(notificationId)}/read`),
  );
}

export async function markAsUnread(
  notificationId: string,
): Promise<{ notification: AppNotification }> {
  return unwrap<{ notification: AppNotification }>(
    await http.patch(`/notifications/${encodeURIComponent(notificationId)}/unread`),
  );
}

export async function markAllAsRead(): Promise<{ modifiedCount: number }> {
  return unwrap<{ modifiedCount: number }>(await http.post("/notifications/mark-all-read"));
}

export async function deleteNotification(notificationId: string): Promise<null> {
  return unwrap<null>(await http.delete(`/notifications/${encodeURIComponent(notificationId)}`));
}

export async function deleteReadNotifications(): Promise<{ deletedCount: number }> {
  return unwrap<{ deletedCount: number }>(await http.delete("/notifications/read"));
}

export type PreferencesChannels = {
  email?: Record<string, boolean>;
  push?: Record<string, boolean>;
  inApp?: Record<string, boolean>;
};

export async function getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  return unwrap<NotificationPreferencesResponse>(await http.get("/notifications/preferences"));
}

export async function updateNotificationPreferences(
  preferences: PreferencesChannels,
): Promise<NotificationPreferencesResponse> {
  return unwrap<NotificationPreferencesResponse>(
    await http.patch("/notifications/preferences", preferences),
  );
}
