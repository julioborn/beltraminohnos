// Piloto: reemplazo flat (ECharts) de StackedBar3DChart, mismo contrato de
// props para que el swap en el caller sea de una sola línea. Server
// Component a propósito: acá se formatean los montos (formatTotal/
// formatSegment) y solo se mandan strings/números ya resueltos a la mitad
// cliente (stacked-bar-chart-interactive.tsx) — ver el comentario ahí para
// el porqué.

import { StackedBarChartInteractive, type StackedBarDetailRow } from "./stacked-bar-chart-interactive";

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

  const categories = visibleRows.map((r) => r.label);

  const series = legend.map((l) => ({
    key: l.key,
    name: l.label,
    color: l.color,
    data: visibleRows.map((r) => r.segments.find((s) => s.key === l.key)?.value ?? 0),
  }));

  const labels = legend.map((l) =>
    visibleRows.map((r) => {
      const segment = r.segments.find((s) => s.key === l.key);
      return segment ? formatSegment(segment.value) : "";
    }),
  );

  const detailRows: StackedBarDetailRow[] = visibleRows.map((r) => ({
    label: r.label,
    totalLabel: formatTotal(r.total),
    segments: r.segments.map((s) => ({ key: s.key, label: s.label, color: s.color, valueLabel: formatSegment(s.value) })),
  }));

  return <StackedBarChartInteractive categories={categories} series={series} labels={labels} detailRows={detailRows} />;
}
