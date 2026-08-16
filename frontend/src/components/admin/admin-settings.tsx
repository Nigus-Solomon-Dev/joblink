"use client";

import { useState } from "react";
import { Save, Settings2 } from "lucide-react";

import { Button, Card, FormField, Input, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-admin";
import type { AdminSettings } from "@/types";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary-600"
      />
    </label>
  );
}

export function AdminSettingsScreen() {
  const settings = useAdminSettings();
  const save = useUpdateAdminSettings();

  const [form, setForm] = useState<Partial<AdminSettings> | null>(null);
  const [prevData, setPrevData] = useState<AdminSettings | undefined>(undefined);

  if (settings.data !== prevData) {
    setPrevData(settings.data);
    setForm(settings.data ?? null);
  }

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const dirty =
    form != null && settings.data != null && JSON.stringify(form) !== JSON.stringify(settings.data);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Settings
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Platform settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Persisted through the backend SiteSetting store.
        </p>
      </header>

      {settings.isPending && <Skeleton className="h-48 w-full" />}

      {form && (
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(form);
          }}
        >
          <Card className="divide-y divide-border p-0">
            <div className="flex items-center gap-2 px-5 py-4">
              <Settings2 className="size-4 text-primary-600" />
              <h2 className="text-sm font-semibold text-foreground">General</h2>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Site name">
                  <Input
                    value={form.siteName ?? ""}
                    onChange={(event) => set("siteName", event.target.value)}
                  />
                </FormField>
                <FormField label="Featured job price">
                  <Input
                    type="number"
                    min={0}
                    value={form.featuredJobPrice ?? 0}
                    onChange={(event) => set("featuredJobPrice", Number(event.target.value))}
                  />
                </FormField>
              </div>
              <FormField label="Site description">
                <Input
                  value={form.siteDescription ?? ""}
                  onChange={(event) => set("siteDescription", event.target.value)}
                />
              </FormField>
              <FormField label="Max file upload size (bytes)">
                <Input
                  type="number"
                  min={0}
                  value={form.maxFileUploadSize ?? 0}
                  onChange={(event) => set("maxFileUploadSize", Number(event.target.value))}
                />
              </FormField>
              <FormField label="Max jobs per company">
                <Input
                  type="number"
                  min={1}
                  value={form.maxJobsPerCompany ?? 0}
                  onChange={(event) => set("maxJobsPerCompany", Number(event.target.value))}
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-0">
            <div className="flex items-center gap-2 px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Feature toggles</h2>
            </div>
            <div className="divide-y divide-border">
              <Toggle
                checked={form.registrationEnabled ?? true}
                onChange={(value) => set("registrationEnabled", value)}
                label="Registration enabled"
                description="Allow new user sign-ups on the site."
              />
              <Toggle
                checked={form.jobPostingEnabled ?? true}
                onChange={(value) => set("jobPostingEnabled", value)}
                label="Job posting enabled"
                description="Allow employers to post new listings."
              />
              <Toggle
                checked={form.emailVerificationRequired ?? true}
                onChange={(value) => set("emailVerificationRequired", value)}
                label="Email verification required"
                description="Require users to verify their email before acting."
              />
              <Toggle
                checked={form.maintenanceMode ?? false}
                onChange={(value) => set("maintenanceMode", value)}
                label="Maintenance mode"
                description="Display the maintenance notice to visitors."
              />
            </div>
          </Card>

          <div className="flex items-center justify-end">
            <Button type="submit" loading={save.isPending} disabled={!dirty}>
              <Save className="size-4" />
              Save settings
            </Button>
          </div>
          {save.isError && (
            <p className="text-right text-sm text-danger-600">Couldn&rsquo;t save settings. Please try again.</p>
          )}
        </form>
      )}

      {settings.isError && (
        <ErrorState
          title="Couldn't load settings"
          message="We couldn't fetch the platform settings."
          onRetry={() => settings.refetch()}
        />
      )}
    </div>
  );
}