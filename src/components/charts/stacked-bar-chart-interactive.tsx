"use client";

// Mitad cliente del gráfico apilado: solo recibe strings/números ya
// formateados (nunca las funciones de formato — eso rompe la serialización
// de RSC al cruzar de Server a Client Component, mismo problema que ya
// documenta bar-chart-3d-interactive.tsx). Tocar la columna abre el panel
// de detalle debajo, igual que en los gráficos 3D; el tooltip de Recharts
// al pasar el mouse es un extra para desktop.

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type StackedBarChartDatum = Record<string, string | number>;
export type StackedBarDetailSegment = { key: string; label: string; color: string; valueLabel: string };
export type StackedBarDetailRow = { label: string; totalLabel: string; segments: StackedBarDetailSegment[] };
export type StackedBarLegendItem = { key: string; label: string; color: string };

export function StackedBarChartInteractive({
  data,
  config,
  legend,
  detailRows,
}: {
  data: StackedBarChartDatum[];
  config: ChartConfig;
  legend: StackedBarLegendItem[];
  detailRows: StackedBarDetailRow[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedItem = detailRows.find((r) => r.label === expanded);

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
          <ChartTooltip cursor={{ fill: "rgba(33, 48, 93, 0.05)" }} content={<ChartTooltipContent />} />
          {legend.map((l, i) => (
            <Bar
              key={l.key}
              dataKey={l.key}
              name={l.label}
              stackId="saldo"
              fill={`var(--color-${l.key})`}
              radius={i === legend.length - 1 ? [4, 4, 0, 0] : 0}
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
                <span className="shrink-0 font-semibold">{s.valueLabel}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 pt-1.5 text-sm font-bold">
              <span>Total</span>
              <span>{expandedItem.totalLabel}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
