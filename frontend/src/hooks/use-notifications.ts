"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  markAsUnread,
  updateNotificationPreferences,
  type NotificationsQueryParams,
  type PreferencesChannels,
} from "@/lib/api/notifications";

export function useNotifications(params: NotificationsQueryParams = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications(params),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

export function useUnreadNotifications() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCount(),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkNotificationUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markAsUnread(notificationId),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      invalidateNotifications(queryClient);
      toast("success", "All notifications marked as read");
    },
    onError: (error) => {
      toast("error", "Could not update notifications", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => deleteReadNotifications(),
    onSuccess: () => {
      invalidateNotifications(queryClient);
      toast("success", "Read notifications cleared");
    },
    onError: (error) => {
      toast("error", "Could not clear notifications", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useNotificationPreferences() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => getNotificationPreferences(),
    enabled: status === "authenticated",
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (preferences: PreferencesChannels) => updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast("success", "Notification preferences updated");
    },
    onError: (error) => {
      toast("error", "Could not update preferences", error instanceof Error ? error.message : undefined);
    },
  });
}