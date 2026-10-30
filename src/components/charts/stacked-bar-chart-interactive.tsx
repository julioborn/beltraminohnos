"use client";

// Mitad cliente del gráfico apilado (ECharts): solo recibe strings/números
// ya formateados (nunca una función de formato — eso rompe la
// serialización de RSC al cruzar de Server a Client Component, ver
// stacked-bar-chart.tsx). Tocar una columna abre el panel de detalle
// debajo, igual que en los gráficos 3D que reemplaza; el tooltip de
// ECharts al pasar el mouse es un extra para desktop.

import { useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption, TooltipComponentFormatterCallbackParams } from "echarts";

export type StackedBarChartSeries = { key: string; name: string; color: string; data: number[] };
export type StackedBarDetailSegment = { key: string; label: string; color: string; valueLabel: string };
export type StackedBarDetailRow = { label: string; totalLabel: string; segments: StackedBarDetailSegment[] };

type EChartsClickParams = { name?: string; seriesName?: string; dataIndex: number };

export function StackedBarChartInteractive({
  categories,
  series,
  labels,
  detailRows,
}: {
  categories: string[];
  series: StackedBarChartSeries[];
  labels: string[][];
  detailRows: StackedBarDetailRow[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedItem = detailRows.find((r) => r.label === expanded);

  const option: EChartsOption = {
    grid: { left: 8, right: 8, top: 20, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: "rgba(0,0,0,0.1)" } },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, fontWeight: 600, color: "rgba(55,53,52,0.5)" },
    },
    yAxis: { type: "value", show: false },
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0,0,0,0.1)",
      textStyle: { color: "#21305d", fontSize: 12 },
      formatter: (raw: TooltipComponentFormatterCallbackParams) => {
        const params = (Array.isArray(raw) ? raw[0] : raw) as EChartsClickParams | undefined;
        if (!params) return "";
        const seriesIndex = series.findIndex((s) => s.name === params.seriesName);
        const value = seriesIndex >= 0 ? labels[seriesIndex]?.[params.dataIndex] : undefined;
        return `<strong>${params.seriesName}</strong><br/>${value ?? ""}`;
      },
    },
    series: series.map((s, i) => ({
      name: s.name,
      type: "bar",
      stack: "saldo",
      data: s.data,
      itemStyle: { color: s.color, borderRadius: i === series.length - 1 ? [4, 4, 0, 0] : 0 },
    })),
  };

  return (
    <div className="flex flex-col gap-3">
      <ReactECharts
        option={option}
        style={{ height: 320, width: "100%" }}
        notMerge
        onEvents={{
          click: (params: EChartsClickParams) => {
            const clicked = params.name;
            if (clicked) setExpanded((cur) => (cur === clicked ? null : clicked));
          },
        }}
      />

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
