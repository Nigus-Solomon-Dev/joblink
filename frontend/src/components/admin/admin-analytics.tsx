"use client";

import { useState } from "react";
import { Activity, Download, Info } from "lucide-react";

import {
  Button,
  Select,
  Tabs,
  TabContent,
} from "@/components/ui";
import { Panel, SectionHeading } from "@/components/shared/admin-panels";
import { DistributionBars, MiniBars } from "@/components/shared/charts";
import { ErrorState } from "@/components/ui/error-state";
import {
  useAdminCompanyAnalytics,
  useAdminJobAnalytics,
  useAdminRevenueAnalytics,
  useAdminUserAnalytics,
  useBuildCustomReport,
  useDeleteScheduledReport,
  useFunnelAnalytics,
  useMarketTrendAnalytics,
  useScheduledReports,
} from "@/hooks/use-admin";
import { cn } from "@/lib/cn";
import type {
  FunnelStep,
  ReportGroupBy,
  ReportType,
} from "@/types";

const PERIODS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "365d", label: "1y" },
] as const;

type AnalyticsPeriod = (typeof PERIODS)[number]["value"];

function splitDay(value: string) {
  return value.length >= 10 ? value.slice(5) : value;
}

function ReportRow({ stage }: { stage: FunnelStep }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-slate-600">{stage.stage}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary-400"
          style={{ width: `${Math.min(100, stage.value === 0 ? 0 : stage.conversionRate != null ? 4 + stage.conversionRate : 4)}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium text-foreground">{stage.value}</span>
    </div>
  );
}

export function AdminAnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [tab, setTab] = useState("overview");

  const users = useAdminUserAnalytics(period);
  const companies = useAdminCompanyAnalytics(period);
  const jobs = useAdminJobAnalytics(period);
  const revenue = useAdminRevenueAnalytics();
  const market = useMarketTrendAnalytics(period === "365d" ? "365d" : period);
  const funnel = useFunnelAnalytics();

  const overviewQueries = [users, companies, jobs, market];
  const overviewError = overviewQueries.find((query) => query.isError);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Admin analytics
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Platform insights</h1>
          <p className="mt-1 text-sm text-slate-600">Real numbers straight from the backend.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border-strong p-0.5">
            {PERIODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  period === option.value
                    ? "bg-primary-600 text-white"
                    : "text-slate-600 hover:bg-surface-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Tabs
        items={[
          { value: "overview", label: "Overview" },
          { value: "funnel", label: "Funnel" },
          { value: "reports", label: "Reports & export" },
        ]}
        value={tab}
        onValueChange={setTab}
      />

      <TabContent value="overview" activeValue={tab}>
        {overviewError ? (
          <ErrorState
            title="Couldn't load analytics"
            message="We couldn't fetch platform analytics for this period."
            onRetry={() => overviewError.refetch()}
          />
        ) : (
        <>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeading title="User registrations" subtitle={`New accounts per day· ${period}`} />
            <div className="h-24">
              <MiniBars data={(users.data?.registrationsOverTime ?? []).map((p) => ({ label: splitDay(p._id), value: p.count }))} />
            </div>
          </Panel>
          <Panel>
            <SectionHeading title="Companies created" subtitle={`New companies per day · ${period}`} />
            <div className="h-24">
              <MiniBars data={(companies.data?.companiesOverTime ?? []).map((p) => ({ label: splitDay(p._id), value: p.count }))} />
            </div>
          </Panel>
          <Panel>
            <SectionHeading title="Jobs posted" subtitle={`New jobs per day · ${period}`} />
            <div className="h-24">
              <MiniBars data={(jobs.data?.jobsOverTime ?? []).map((p) => ({ label: splitDay(p._id), value: p.count }))} />
            </div>
          </Panel>
          <Panel>
            <SectionHeading title="Market job types" subtitle="Published jobs by employment type" />
            <DistributionBars entries={Object.entries(market.data?.jobTypes ?? {}) as Array<[string, number]>} />
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel>
            <SectionHeading title="Jobs by type" />
            <DistributionBars entries={Object.entries(jobs.data?.jobsByType ?? {}) as Array<[string, number]>} />
          </Panel>
          <Panel>
            <SectionHeading title="Jobs by category" />
            <DistributionBars entries={Object.entries(jobs.data?.jobsByCategory ?? {})} />
          </Panel>
          <Panel>
            <SectionHeading title="Companies by industry" />
            <DistributionBars entries={Object.entries(companies.data?.companiesByIndustry ?? {})} />
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeading title="Market snapshot" subtitle="Derived from published jobs" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-xs text-slate-500">Published jobs</p>
                <p className="mt-1 text-xl font-bold text-foreground">{market.data?.marketAnalysis.totalJobs ?? "–"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-xs text-slate-500">Remote jobs</p>
                <p className="mt-1 text-xl font-bold text-foreground">{market.data?.marketAnalysis.remoteJobs ?? "–"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-xs text-slate-500">Avg applications</p>
                <p className="mt-1 text-xl font-bold text-foreground">{market.data?.marketAnalysis.totalApplications ?? "–"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-xs text-slate-500">Featured jobs</p>
                <p className="mt-1 text-xl font-bold text-foreground">{jobs.data?.featuredJobsCount ?? "–"}</p>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionHeading title="Revenue" subtitle="What the platform actually reports" />
            {revenue.data?.revenueAvailable === false ? (
              <div className="flex items-start gap-3 rounded-lg border border-info-100 bg-info-50/50 p-4">
                <Info className="mt-0.5 size-5 shrink-0 text-info-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">No monetary revenue is reported</p>
                  <p className="mt-1 text-sm text-slate-600">
                    This platform has no payment or subscription system, so dollar figures would be fabricated.
                    The backend returns real activity metrics instead.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-surface p-3">
                      <p className="text-xs text-slate-500">Companies</p>
                      <p className="mt-1 text-xl font-bold text-foreground">{revenue.data?.activity.totalCompanies ?? "–"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-3">
                      <p className="text-xs text-slate-500">Successful hires</p>
                      <p className="mt-1 text-xl font-bold text-foreground">{revenue.data?.activity.successfulHires ?? "–"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading revenue status…</p>
            )}
          </Panel>
        </div>
        </>
        )}
      </TabContent>

      <TabContent value="funnel" activeValue={tab}>
        <Panel>
          <SectionHeading title="Application funnel" subtitle="Visitor → hired, based on recent activity" />
          {funnel.isError ? (
            <ErrorState
              title="Couldn't load the funnel"
              message="We couldn't fetch the application funnel."
              onRetry={() => funnel.refetch()}
              className="py-8"
            />
          ) : (
          <div className="space-y-3">
            {(funnel.data?.funnel ?? []).map((stage) => (
              <ReportRow key={stage.stage} stage={stage} />
            ))}
          </div>
          )}
        </Panel>
      </TabContent>

      <TabContent value="reports" activeValue={tab}>
        <ReportsSection />
      </TabContent>
    </div>
  );
}

const REPORT_TYPES: ReportType[] = ["users", "jobs", "applications", "companies"];

function ReportsSection() {
  const build = useBuildCustomReport();
  const scheduled = useScheduledReports();
  const removeScheduled = useDeleteScheduledReport();

  const [reportType, setReportType] = useState<ReportType>("users");
  const [groupBy, setGroupBy] = useState<ReportGroupBy>("status");
  const [metrics, setMetrics] = useState<string[]>([]);
  const [report, setReport] = useState<{ type: ReportType; total: number; rows: Array<{ label: string; count: number }> } | null>(null);

  const results = Array.isArray(scheduled.data) ? scheduled.data : [];

  const groupByOptions: ReportGroupBy[] =
    reportType === "users"
      ? ["role", "status"]
      : reportType === "jobs"
        ? ["status", "type", "experienceLevel"]
        : reportType === "companies"
          ? ["status", "industry", "size"]
          : ["status"];

  const generate = () => {
    setReport(null);
    build.mutate(
      { reportType, groupBy, metrics },
      {
        onSuccess: (data) => {
          setReport({
            type: reportType,
            total: data.metadata.totalRecords,
            rows: (data.data ?? []).map((item) => ({ label: String(item._id), count: item.count })),
          });
        },
      },
    );
  };

  const download = async (format: "csv" | "json") => {
    const { adminApi } = await import("@/lib/api");
    const blob = await adminApi.exportReportData(reportType, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-report.${format === "csv" ? "csv" : "json"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel>
        <SectionHeading title="Custom report" subtitle="Aggregate platform records by a grouping field" />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Report type</span>
              <Select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Group by</span>
              <Select value={groupBy} onChange={(event) => setGroupBy(event.target.value as ReportGroupBy)}>
                {groupByOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/([A-Z])/g, " $1").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <CheckboxInput
            checked={metrics.includes("total")}
            onChange={(checked) => setMetrics(checked ? ["total"] : [])}
            label="Include a total summary row"
          />
          <Button onClick={generate} loading={build.isPending}>
            <Activity className="size-4" />
            Generate report
          </Button>
          {build.isError && (
            <p className="text-sm text-danger-600">
              Couldn&rsquo;t generate the report. Please try again.
            </p>
          )}
        </div>
      </Panel>

      <Panel>
        <SectionHeading title="Exports" subtitle="Download the current dataset as CSV or JSON" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => void download("csv")}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => void download("json")}>
            <Download className="size-4" />
            Export JSON
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Exports respect the selected report type above and stream from the backend export endpoint.
        </p>
      </Panel>

      {report && (
        <Panel className="lg:col-span-2">
          <SectionHeading
            title={`${report.type.charAt(0).toUpperCase() + report.type.slice(1)} report`}
            subtitle={`${report.total.toLocaleString()} total records${metrics.includes("total") ? " (summary included)" : ""}`}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <DistributionBars entries={report.rows.map((row) => [row.label, row.count])} />
            <div className="rounded-lg border border-border bg-surface-muted p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</p>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Total</dt>
                  <dd className="font-medium text-foreground">{report.total.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Panel>
      )}

      <Panel className="lg:col-span-2">
        <SectionHeading title="Scheduled reports" subtitle="Recurring exports configured on the backend" />
        {scheduled.isError ? (
          <ErrorState
            title="Couldn't load scheduled reports"
            message="We couldn't fetch your scheduled report configurations."
            onRetry={() => scheduled.refetch()}
            className="py-8"
          />
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-500">No scheduled reports yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {results.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.reportType} · {item.format} · {item.frequency}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.recipients.join(", ")}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeScheduled.mutate(item.id)}
                  loading={removeScheduled.isPending}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function CheckboxInput({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary-600"
      />
      {label}
    </label>
  );
}