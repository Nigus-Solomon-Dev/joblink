export function DistributionBars({
  entries,
  maxDefault = 1,
}: {
  entries: Array<[string, number]>;
  maxDefault?: number;
}) {
  const max = Math.max(maxDefault, ...entries.map(([, value]) => value));
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No data yet.</p>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <span className="w-32 truncate text-slate-600">{key.replaceAll("_", " ")}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-xs font-medium text-slate-500">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function MiniBars({
  data,
  height = 56,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <div className="flex h-full items-end gap-1.5">
      {data.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-1" title={`${point.label}: ${point.value}`}>
          <span className="text-[10px] leading-none text-slate-500">{point.value || ""}</span>
          <div
            className="w-full rounded-t-md bg-primary-200 transition-colors hover:bg-primary-400"
            style={{ height: `${Math.max(4, (point.value / max) * height)}px` }}
          />
          <span className="truncate text-[10px] text-slate-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}