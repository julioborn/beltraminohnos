export { BAR_COLORS } from "./bar-chart-3d-constants";

import {
  Bar3DChartInteractive,
  StackedBar3DChartInteractive,
  type Bar3DItem,
  type StackedBand,
  type StackedColumnItem,
  type StackedLegendItem,
} from "./bar-chart-3d-interactive";
import { BAR_COLORS, MIN_HEIGHT_PCT, STACKED_CHART_H_PX, SVG_DEPTH, SVG_H, TOP_N_DEFAULT } from "./bar-chart-3d-constants";

export type Bar3DRow = { label: string; primary: number; secondary?: number };

// El prisma (SVG, geometría exacta en coordenadas de viewBox) se estira
// libremente para llenar su columna — ahí no hay texto adentro, así que no
// importa que se distorsione un poco en una columna angosta. El valor y
// las etiquetas son HTML normal superpuesto, no texto SVG: así nunca se
// deforman ni se pisan entre columnas, solo se truncan si no entran (con
// "..." y el valor completo en el title). Tocar la columna entera abre un
// panel de detalle debajo con el monto completo (y, en el apilado, el
// desglose de todos los segmentos) — así no depende de que el texto entre.
//
// El formateo (formatPrimary/formatSecondary) se hace acá, en el server —
// bar-chart-3d-interactive.tsx es "use client" y recibe solo strings/números
// ya formateados, nunca las funciones de formato (eso rompe la
// serialización de RSC al cruzar a un Client Component).
export function Bar3DChart({
  rows,
  topN = TOP_N_DEFAULT,
  formatPrimary,
  formatSecondary,
  emptyLabel = "Sin datos para mostrar.",
}: {
  rows: Bar3DRow[];
  topN?: number;
  formatPrimary: (value: number) => string;
  formatSecondary?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-btm-black/50">{emptyLabel}</p>;
  }

  const top = rows.slice(0, topN);
  const max = Math.max(...top.map((r) => r.primary), 1);

  const items: Bar3DItem[] = top.map((r, i) => ({
    label: r.label,
    color: BAR_COLORS[i % BAR_COLORS.length],
    heightPct: Math.max((r.primary / max) * 100, r.primary > 0 ? MIN_HEIGHT_PCT : 0),
    primaryLabel: formatPrimary(r.primary),
    secondaryLabel: formatSecondary && r.secondary !== undefined ? formatSecondary(r.secondary) : undefined,
  }));

  return <Bar3DChartInteractive items={items} />;
}

// --- Gráfico de barras 3D apiladas (por sucursal, segmentado por producto) ---

export type StackedBar3DSegment = { key: string; label: string; value: number; color: string };
export type StackedBar3DRow = { label: string; total: number; segments: StackedBar3DSegment[] };
export type StackedBar3DLegendItem = { key: string; label: string; color: string };

export function StackedBar3DChart({
  rows,
  formatTotal,
  formatSegment,
  legend,
  emptyLabel = "Sin datos para mostrar.",
}: {
  rows: StackedBar3DRow[];
  formatTotal: (value: number) => string;
  formatSegment: (value: number) => string;
  legend: StackedBar3DLegendItem[];
  emptyLabel?: string;
}) {
  const visibleRows = rows.filter((r) => r.total > 0 || r.segments.length > 0);
  if (visibleRows.length === 0) {
    return <p className="text-sm text-btm-black/50">{emptyLabel}</p>;
  }

  const max = Math.max(...visibleRows.map((r) => r.total), 1);

  const items: StackedColumnItem[] = visibleRows.map((r) => {
    const heightPct = Math.max((r.total / max) * 100, r.total > 0 ? MIN_HEIGHT_PCT : 0);
    return {
      label: r.label,
      totalLabel: formatTotal(r.total),
      heightPct,
      bands: computeBands(r, heightPct, formatSegment),
    };
  });

  const legendItems: StackedLegendItem[] = legend;

  return <StackedBar3DChartInteractive items={items} legend={legendItems} />;
}

// Geometría de cada segmento apilado (coordenadas del SVG + % para las
// etiquetas) — pura matemática, se puede calcular en el server y mandar ya
// resuelta al Client Component que la dibuja.
function computeBands(row: StackedBar3DRow, heightPct: number, formatSegment: (value: number) => string): StackedBand[] {
  const baseY = SVG_H;
  const totalFrontHeight = (heightPct / 100) * (SVG_H - SVG_DEPTH);

  let cumHeight = 0;
  return row.segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = row.total > 0 ? s.value / row.total : 0;
      const segHeight = totalFrontHeight * frac;
      const segBaseY = baseY - cumHeight;
      const segTopY = segBaseY - segHeight;
      cumHeight += segHeight;
      const midY = (segTopY + segBaseY) / 2;
      const labelBottomPct = ((SVG_H - midY) / SVG_H) * 100;
      const pxHeight = (segHeight / SVG_H) * STACKED_CHART_H_PX;
      return {
        key: `${row.label}::${s.key}`,
        label: s.label,
        valueLabel: formatSegment(s.value),
        color: s.color,
        segTopY,
        segBaseY,
        labelBottomPct,
        pxHeight,
      };
    });
}
