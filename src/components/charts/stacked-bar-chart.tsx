"use client";

// Piloto: reemplazo flat (Recharts + primitivas de shadcn/ui en
// src/components/ui/chart.tsx) de StackedBar3DChart, mismo contrato de
// props para que el swap en el caller sea de una sola línea. Mantiene la
// interacción ya validada para mobile — tocar la columna abre un panel de
// detalle debajo con el desglose completo — en vez de depender solo del
// tooltip de Recharts (que es hover/touch-drag y en el celu es menos
// confiable). El tooltip de Recharts queda como beneficio extra para
// desktop.

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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
  const [expanded, setExpanded] = useState<string | null>(null);

  const visibleRows = rows.filter((r) => r.total > 0 || r.segments.length > 0);
  if (visibleRows.length === 0) {
    return <p className="text-sm text-btm-black/50">{emptyLabel}</p>;
  }

  const config: ChartConfig = Object.fromEntries(legend.map((l) => [l.key, { label: l.label, color: l.color }]));

  const data = visibleRows.map((r) => {
    const entry: Record<string, string | number> = { label: r.label, __total: r.total };
    for (const s of r.segments) entry[s.key] = s.value;
    return entry;
  });

  const expandedItem = visibleRows.find((r) => r.label === expanded);

  return (
    <div className="flex flex-col gap-3">
      <ChartContainer config={config} className="h-[320px] w-full">
        <BarChart
          data={data}
          onClick={(state) => {
            const clicked = state?.activeLabel;
            if (typeof clicked === "string") setExpanded((cur) => (cur === clicked ? null : clicked));
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fontWeight: 600 }}
            interval={0}
          />
          <YAxis hide />
          <ChartTooltip
            cursor={{ fill: "rgba(33, 48, 93, 0.05)" }}
            content={<ChartTooltipContent valueFormatter={formatSegment} />}
          />
          {legend.map((l, i) => (
            <Bar
              key={l.key}
              dataKey={l.key}
              name={l.label}
              stackId="saldo"
              fill={`var(--color-${l.key})`}
              radius={i === legend.length - 1 ? [4, 4, 0, 0] : 0}
              className="cursor-pointer"
            />
          ))}
        </BarChart>
      </ChartContainer>

      {expandedItem && (
        <div className="rounded-lg border border-black/10 bg-black/[.02] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy">
              Detalle · {expandedItem.label}
            </h3>
            <button
              type="button"
              onClick={() => setExpanded(null)}
              className="shrink-0 text-xs font-semibold text-btm-black/50 hover:text-btm-navy"
            >
              Cerrar
            </button>
          </div>
          <ul className="flex flex-col divide-y divide-black/5 text-sm">
            {expandedItem.segments.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatSegment(s.value)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 pt-1.5 text-sm font-bold">
              <span>Total</span>
              <span>{formatTotal(expandedItem.total)}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
