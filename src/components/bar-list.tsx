export function BarList({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number; sublabel?: string }[];
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  if (rows.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin datos para este período.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-btm-black/80">
              {row.label}
              {row.sublabel && <span className="ml-1.5 text-btm-black/40">{row.sublabel}</span>}
            </span>
            <span className="shrink-0 font-semibold text-btm-navy">{formatValue(row.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/5">
            <div
              className="h-2 rounded-full bg-btm-navy"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
