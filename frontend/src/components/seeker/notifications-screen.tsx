"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  FileText,
  Inbox,
  MessageSquare,
  RefreshCcw,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  useDeleteNotification,
  useDeleteReadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useNotificationPreferences,
  useNotifications,
  useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import {
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  Select,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { notificationTypeLabels, timeAgo } from "@/lib/format";
import type { AppNotification, NotificationPreferences, NotificationType } from "@/types";

const typeOptions: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "job_application", label: "Job application" },
  { value: "application_status_update", label: "Application update" },
  { value: "new_job_match", label: "New job match" },
  { value: "message", label: "Message" },
  { value: "system", label: "System" },
];

const readOptions = [
  { value: "all", label: "All notifications" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const NOTIFICATION_ICONS = {
  job_application: FileText,
  application_status_update: RefreshCcw,
  new_job_match: Sparkles,
  message: MessageSquare,
  system: Bell,
} as const;

function notificationHref(notification: AppNotification): string | null {
  const entity = notification.relatedEntity;
  if (entity) {
    if (entity.entityType === "job") return `/jobs/${entity.entityId}`;
    if (entity.entityType === "application") return "/applications";
    if (entity.entityType === "company") return "/companies";
    if (entity.entityType === "conversation") return `/messages?conversation=${encodeURIComponent(entity.entityId)}`;
  }
  const conversationId = notification.data?.conversationId;
  if (notification.type === "message" && conversationId) {
    return `/messages?conversation=${encodeURIComponent(conversationId as string)}`;
  }
  if (notification.type === "message") return "/messages";
  return null;
}

const preferenceKeys: NotificationType[] = [
  "job_application",
  "application_status_update",
  "new_job_match",
  "message",
  "system",
];

export function NotificationsScreen() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<NotificationType | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const notifications = useNotifications({
    page,
    limit: 10,
    type: type === "all" ? undefined : type,
    isRead: readFilter === "all" ? undefined : readFilter === "unread" ? "false" : "true",
  });
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const markAll = useMarkAllNotificationsRead();
  const clearRead = useDeleteReadNotifications();
  const remove = useDeleteNotification();

  const preferences = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [preferencesDraft, setPreferencesDraft] = useState<NotificationPreferences | null>(null);

  const currentPreferences = preferencesDraft ?? preferences.data?.preferences;

  const togglePreference = (channel: keyof NotificationPreferences, key: string) => {
    const base = preferences.data?.preferences ?? preferencesDraft;
    if (!base) return;
    setPreferencesDraft({
      ...base,
      [channel]: { ...base[channel], [key]: !base[channel][key] },
    });
  };

  const openSettings = () => {
    setPreferencesDraft(preferences.data?.preferences ?? null);
    setSettingsOpen(true);
  };

  const savePreferences = () => {
    if (!preferencesDraft) return;
    updatePreferences.mutate(preferencesDraft, { onSuccess: () => setSettingsOpen(false) });
  };

  const icons = NOTIFICATION_ICONS;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            Application updates, new matches, and messages — all in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings2 className="size-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearRead.mutate()}>
            <Trash2 className="size-4" />
            Clear read
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          aria-label="Filter by type"
          className="w-56"
          value={type}
          onChange={(event) => {
            setType(event.target.value as NotificationType | "all");
            setPage(1);
          }}
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by read status"
          className="w-56"
          value={readFilter}
          onChange={(event) => {
            setReadFilter(event.target.value as "all" | "unread" | "read");
            setPage(1);
          }}
        >
          {readOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {notifications.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-surface-sunken/60" />
          ))}
        </div>
      ) : notifications.isError ? (
        <ErrorState
          title="Couldn&rsquo;t load notifications"
          message={
            notifications.error instanceof Error ? notifications.error.message : undefined
          }
          onRetry={() => notifications.refetch()}
        />
      ) : (notifications.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="You&rsquo;re all caught up"
          description="New updates about your applications and matches will appear here."
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
          {notifications.data?.data.map((notification) => {
            const Icon = icons[notification.type] ?? Bell;
            const href = notificationHref(notification);
            const mark = () => {
              if (!notification.isRead) markRead.mutate(notification._id);
            };
            const content = (
              <>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg",
                    notification.isRead
                      ? "bg-surface-muted text-slate-400"
                      : "bg-primary-50 text-primary-700",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "text-sm",
                        notification.isRead
                          ? "font-medium text-slate-600"
                          : "font-semibold text-foreground",
                      )}
                    >
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{notification.message}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 self-center">
                  {!notification.isRead && (
                    <span className="size-2 rounded-full bg-accent-600" aria-label="Unread" />
                  )}
                </span>
              </>
            );

            return (
              <li key={notification._id} className="relative">
                {href ? (
                  <Link
                    href={href}
                    onClick={mark}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-surface-muted/60"
                  >
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={mark} className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-muted/60">
                    {content}
                  </button>
                )}
                <div className="absolute right-4 top-3.5 flex items-center gap-1">
                  {notification.isRead ? (
                    <button
                      type="button"
                      onClick={() => markUnread.mutate(notification._id)}
                      className="rounded p-1 text-slate-400 hover:bg-surface-muted hover:text-foreground"
                      aria-label="Mark as unread"
                    >
                      <RefreshCcw className="size-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markRead.mutate(notification._id)}
                      className="rounded p-1 text-slate-400 hover:bg-surface-muted hover:text-foreground"
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(notification._id)}
                    className="rounded p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                    aria-label="Delete notification"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {notifications.data && notifications.data.meta.totalPages > 1 && (
        <Pagination
          className="mt-2"
          page={notifications.data.meta.page}
          totalPages={notifications.data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Notification settings"
        description="Choose how you want to hear about each type of update."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button loading={updatePreferences.isPending} onClick={savePreferences}>
              Save preferences
            </Button>
          </>
        }
      >
        {currentPreferences ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-foreground">Notification type</th>
                  <th className="pb-2 pl-4 font-semibold text-foreground">Email</th>
                  <th className="pb-2 pl-4 font-semibold text-foreground">Push</th>
                  <th className="pb-2 pl-4 font-semibold text-foreground">In-app</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preferenceKeys.map((key) => (
                  <tr key={key}>
                    <td className="py-2.5 font-medium text-slate-700">
                      {notificationTypeLabels[key]}
                    </td>
                    <td className="py-2.5 pl-4">
                      <Checkbox
                        name={`email-${key}`}
                        checked={Boolean(currentPreferences.email[key])}
                        onChange={() => togglePreference("email", key)}
                        aria-label={`Email: ${notificationTypeLabels[key]}`}
                      />
                    </td>
                    <td className="py-2.5 pl-4">
                      <Checkbox
                        name={`push-${key}`}
                        checked={Boolean(currentPreferences.push[key])}
                        onChange={() => togglePreference("push", key)}
                        aria-label={`Push: ${notificationTypeLabels[key]}`}
                      />
                    </td>
                    <td className="py-2.5 pl-4">
                      <Checkbox
                        name={`inApp-${key}`}
                        checked={Boolean(currentPreferences.inApp[key])}
                        onChange={() => togglePreference("inApp", key)}
                        aria-label={`In-app: ${notificationTypeLabels[key]}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading preferences…</p>
        )}
      </Modal>
    </div>
  );
}