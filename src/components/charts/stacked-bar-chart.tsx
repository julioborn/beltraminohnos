// Piloto: reemplazo flat (Recharts + primitivas de shadcn/ui) de
// StackedBar3DChart, mismo contrato de props para que el swap en el caller
// sea de una sola línea. Server Component a propósito: acá se formatean los
// montos (formatTotal/formatSegment) y solo se mandan strings/números ya
// resueltos a la mitad cliente (stacked-bar-chart-interactive.tsx) — ver el
// comentario ahí para el porqué.

import { StackedBarChartInteractive, type StackedBarDetailRow } from "./stacked-bar-chart-interactive";
import type { ChartConfig } from "@/components/ui/chart";

export type StackedBarChartSegment = { key: string; label: string; value: number; color: string };
export type StackedBarChartRow = { label: string; total: number; segments: StackedBarChartSegment[] };
export type StackedBarChartLegendItem = { key: string; label: string; color: string };

export function StackedBarChart({
  rows,
  formatTotal,
  formatSegment,
  legend,
  emptyLabel = "Sin datos para mostrar.",
}: {
  rows: StackedBarChartRow[];
  formatTotal: (value: number) => string;
  formatSegment: (value: number) => string;
  legend: StackedBarChartLegendItem[];
  emptyLabel?: string;
}) {
  const visibleRows = rows.filter((r) => r.total > 0 || r.segments.length > 0);
  if (visibleRows.length === 0) {
    return <p className="text-sm text-btm-black/50">{emptyLabel}</p>;
  }

  const config: ChartConfig = Object.fromEntries(legend.map((l) => [l.key, { label: l.label, color: l.color }]));

  const data = visibleRows.map((r) => {
    const entry: Record<string, string | number> = { label: r.label };
    for (const s of r.segments) {
      entry[s.key] = s.value;
      entry[`${s.key}__label`] = formatSegment(s.value);
    }
    return entry;
  });

  const detailRows: StackedBarDetailRow[] = visibleRows.map((r) => ({
    label: r.label,
    totalLabel: formatTotal(r.total),
    segments: r.segments.map((s) => ({ key: s.key, label: s.label, color: s.color, valueLabel: formatSegment(s.value) })),
  }));

  return <StackedBarChartInteractive data={data} config={config} legend={legend} detailRows={detailRows} />;
}
