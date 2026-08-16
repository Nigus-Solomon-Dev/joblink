"use client";

import { useState } from "react";
import { Search, Trash2, UserCog } from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  ErrorState,
  FormField,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
} from "@/components/ui";
import { useAdminUserStats, useAdminUsers, useDeleteAdminUser, useUpdateAdminUser } from "@/hooks/use-admin";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { User, UserRole, UserStatus } from "@/types";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "job_seeker", label: "Job seeker" },
  { value: "employer", label: "Employer" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending_verification", label: "Pending verification" },
];

function statusVariant(status: UserStatus) {
  switch (status) {
    case "active":
      return "success" as const;
    case "inactive":
      return "neutral" as const;
    case "suspended":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

function roleVariant(role: UserRole) {
  if (role === "admin") return "danger" as const;
  if (role === "employer") return "primary" as const;
  return "info" as const;
}

function EditModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const update = useUpdateAdminUser();

  const [role, setRole] = useState<UserRole | "">(user?.role ?? "");
  const [status, setStatus] = useState<UserStatus | "">(user?.status ?? "");
  const [emailVerified, setEmailVerified] = useState<boolean>(user?.emailVerified ?? false);

  const canSubmit = user && role && status;

  const save = () => {
    if (!user || !role || !status) return;
    update.mutate(
      { id: user._id, input: { role, status, emailVerified } },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Edit user"
      description={user ? `${user.name} · ${user.email}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={update.isPending} disabled={!canSubmit}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Role" htmlFor="admin-user-role">
          <Select id="admin-user-role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="" disabled>Select role…</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="admin-user-status">
          <Select id="admin-user-status" value={status} onChange={(event) => setStatus(event.target.value as UserStatus)}>
            <option value="" disabled>Select status…</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </FormField>
        <Checkbox
          label="Email verified"
          checked={emailVerified}
          onChange={(event) => setEmailVerified(event.target.checked)}
        />
      </div>
    </Modal>
  );
}

export function AdminUsersScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const usersQuery = useAdminUsers({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });
  const stats = useAdminUserStats();
  const remove = useDeleteAdminUser();

  const applySearch = () => setSearch(searchInput.trim());

  const totalPages = usersQuery.data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Users
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">User management</h1>
        <p className="mt-1 text-sm text-slate-600">
          {stats.data?.total ?? "–"} accounts · {stats.data?.recentSignups ?? "–"} this month.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applySearch();
            }}
            placeholder="Search by name or email…"
            className="pl-9"
            aria-label="Search users by name or email"
          />
        </div>
        <Button variant="secondary" onClick={applySearch}>Search</Button>
        <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="w-40" aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-48" aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Verified</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersQuery.isError && (
                <tr>
                  <td colSpan={6} className="p-4">
                    <ErrorState
                      title="Couldn't load users"
                      message="Something went wrong while fetching users."
                      onRetry={() => usersQuery.refetch()}
                    />
                  </td>
                </tr>
              )}

              {!usersQuery.isError && usersQuery.isPending &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-14" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-16" /></td>
                  </tr>
                ))}

              {!usersQuery.isError && !usersQuery.isPending && (usersQuery.data?.data ?? []).map((user) => (
                <tr key={user._id} className="hover:bg-surface-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant(user.role)}>{user.role.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(user.status)} dot>{user.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("font-medium", user.emailVerified ? "text-success-600" : "text-slate-400")}>
                      {user.emailVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                        <UserCog className="size-4" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(user)} aria-label={`Delete ${user.name}`}>
                        <Trash2 className="size-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!usersQuery.isError && !usersQuery.isPending && (usersQuery.data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <EditModal user={editing} onClose={() => setEditing(null)} />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete user"
        description={deleting ? `${deleting.name} (${deleting.email}) will be permanently removed.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => {
                if (deleting) remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This action cannot be undone.</p>
      </Modal>
    </div>
  );
}