import { TapToggleBar, StackedBarColumn, type StackedBand } from "./bar-chart-3d-interactive";
import {
  BAR_COLORS,
  MIN_HEIGHT_PCT,
  STACKED_CHART_H_PX,
  STACKED_DEPTH_OFFSET_PX,
  STACKED_GRID_PT_PX,
  SVG_DEPTH,
  SVG_H,
  TOP_N_DEFAULT,
} from "./bar-chart-3d-constants";

export { BAR_COLORS } from "./bar-chart-3d-constants";

export type Bar3DRow = { label: string; primary: number; secondary?: number };

// El prisma (SVG, geometría exacta en coordenadas de viewBox) se estira
// libremente para llenar su columna — ahí no hay texto adentro, así que no
// importa que se distorsione un poco en una columna angosta. El valor y
// las etiquetas son HTML normal superpuesto, no texto SVG: así nunca se
// deforman ni se pisan entre columnas, solo se truncan si no entran (con
// "..." y el valor completo en el title). Además, tocar una barra muestra
// el detalle completo en un globo — así no depende de que el texto entre.
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

  return (
    <div
      className="grid items-end gap-1.5 pt-9"
      style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))` }}
    >
      {top.map((r, i) => {
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const heightPct = Math.max((r.primary / max) * 100, r.primary > 0 ? MIN_HEIGHT_PCT : 0);
        const primaryLabel = formatPrimary(r.primary);
        const secondaryLabel = formatSecondary && r.secondary !== undefined ? formatSecondary(r.secondary) : undefined;
        const tooltipText = secondaryLabel ? `${r.label}: ${primaryLabel} · ${secondaryLabel}` : `${r.label}: ${primaryLabel}`;
        return (
          <div key={r.label} className="flex min-w-0 flex-col items-center">
            <TapToggleBar color={color} heightPct={heightPct} primaryLabel={primaryLabel} tooltipText={tooltipText} />
            {secondaryLabel && (
              <span className="btm-fig mt-1 max-w-full truncate text-[10px] font-semibold text-btm-black/60">
                {secondaryLabel}
              </span>
            )}
            <span
              className="mt-0.5 w-full truncate text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
              title={r.label}
            >
              {r.label}
            </span>
          </div>
        );
      })}
    </div>
  );
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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="grid min-w-0 flex-1 items-end gap-2"
        style={{ gridTemplateColumns: `repeat(${visibleRows.length}, minmax(0, 1fr))`, paddingTop: STACKED_GRID_PT_PX }}
      >
        {visibleRows.map((r) => {
          const heightPct = Math.max((r.total / max) * 100, r.total > 0 ? MIN_HEIGHT_PCT : 0);
          const totalLabel = formatTotal(r.total);
          const bands = computeBands(r, heightPct, formatSegment);
          return (
            <div key={r.label} className="flex min-w-0 flex-col items-center">
              <div className="relative flex w-full items-end justify-center" style={{ height: STACKED_CHART_H_PX }}>
                <span
                  className="btm-fig absolute left-1/2 z-10 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
                  style={{ bottom: `calc(${heightPct}% + ${STACKED_DEPTH_OFFSET_PX}px)`, transform: "translateX(-50%)" }}
                  title={totalLabel}
                >
                  {totalLabel}
                </span>
                <StackedBarColumn bands={bands} />
              </div>
              <span
                className="mt-0.5 w-full truncate text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
                title={r.label}
              >
                {r.label}
              </span>
            </div>
          );
        })}
      </div>
      {legend.length > 1 && (
        <div className="flex shrink-0 flex-row flex-wrap gap-x-4 gap-y-1.5 sm:w-44 sm:flex-col">
          {legend.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
              <span className="truncate text-[11px] font-semibold text-btm-black/70" title={l.label}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
      const valueLabel = formatSegment(s.value);
      return {
        key: `${row.label}::${s.key}`,
        label: s.label,
        valueLabel,
        tooltipText: `${s.label}: ${valueLabel}`,
        color: s.color,
        segTopY,
        segBaseY,
        labelBottomPct,
        pxHeight,
      };
    });
}
