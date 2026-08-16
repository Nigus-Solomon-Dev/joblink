"use client";

import { useState } from "react";
import { BadgeCheck, Search, ShieldCheck, Trash2, XCircle } from "lucide-react";

import {
  Badge,
  Button,
  ErrorState,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
} from "@/components/ui";
import { CompanyLogo } from "@/components/companies/company-logo";
import {
  useAdminCompanies,
  useDeleteAdminCompany,
  useVerifyAdminCompany,
} from "@/hooks/use-admin";
import { timeAgo } from "@/lib/format";
import type { Company } from "@/types";

export function AdminCompaniesScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [verified, setVerified] = useState<string>("");
  const [deleting, setDeleting] = useState<Company | null>(null);

  const companiesQuery = useAdminCompanies({
    page,
    limit: 20,
    search: search || undefined,
    isVerified: verified === "" ? undefined : verified === "true",
  });
  const verify = useVerifyAdminCompany();
  const remove = useDeleteAdminCompany();

  const totalPages = companiesQuery.data?.meta.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Companies
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Company management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review, verify, and moderate employer company profiles.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setSearch(searchInput.trim());
            }}
            placeholder="Search companies…"
            className="pl-9"
            aria-label="Search companies by name"
          />
        </div>
        <Button variant="secondary" onClick={() => setSearch(searchInput.trim())}>Search</Button>
        <Select value={verified} onChange={(event) => { setVerified(event.target.value); setPage(1); }} className="w-44" aria-label="Filter by verification status">
          <option value="">All verification</option>
          <option value="true">Verified</option>
          <option value="false">Not verified</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Industry</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Verification</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companiesQuery.isError && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <ErrorState
                      title="Couldn't load companies"
                      message="Something went wrong while fetching companies."
                      onRetry={() => companiesQuery.refetch()}
                    />
                  </td>
                </tr>
              )}

              {!companiesQuery.isError && companiesQuery.isPending &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-56" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-24" /></td>
                  </tr>
                ))}

              {!companiesQuery.isError && !companiesQuery.isPending && (companiesQuery.data?.data ?? []).map((company) => (
                <tr key={company._id} className="hover:bg-surface-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={company.name} logo={company.logo} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{company.name}</p>
                        <p className="truncate text-xs text-slate-500">{company.location || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{company.industry || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={company.isVerified ? "success" : "warning"} dot>
                      {company.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(company.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {company.isVerified ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verify.mutate({ id: company._id, isVerified: false })}
                        >
                          <XCircle className="size-4 text-warning-600" />
                          Unverify
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verify.mutate({ id: company._id, isVerified: true })}
                        >
                          <BadgeCheck className="size-4 text-success-600" />
                          Verify
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(company)} aria-label={`Delete ${company.name}`}>
                        <Trash2 className="size-4 text-danger-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!companiesQuery.isError && !companiesQuery.isPending && (companiesQuery.data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    No companies match these filters.
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

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete company"
        description={deleting ? `${deleting.name} and its jobs will be permanently removed.` : undefined}
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
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning-600" />
          This is a destructive action and cannot be undone.
        </div>
      </Modal>
    </div>
  );
}