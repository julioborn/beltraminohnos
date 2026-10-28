"use client";

// Piezas interactivas de los gráficos de barras 3D: tocar una columna entera
// abre un panel de detalle debajo del gráfico con el desglose completo de
// esa columna (todos los "pisos" en el caso del apilado). Separado de
// bar-chart-3d.tsx a propósito: ese archivo sigue siendo un Server Component
// que recibe funciones de formato (formatPrimary, formatSegment, etc.) —
// pasarlas como prop a un Client Component rompe la serialización de RSC
// (ya nos pasó una vez con MovimientosTable). Acá solo llegan strings y
// números ya formateados.

import { useState } from "react";
import {
  BAR_W,
  CHART_H_PX,
  DEPTH_PX,
  STACKED_CHART_H_PX,
  STACKED_DEPTH_OFFSET_PX,
  STACKED_GRID_PT_PX,
  STACKED_MIN_SEGMENT_LABEL_PX,
  SVG_DEPTH,
  SVG_H,
  SVG_W,
} from "./bar-chart-3d-constants";

// --- Barra simple ---

export type Bar3DItem = {
  label: string;
  color: string;
  heightPct: number;
  primaryLabel: string;
  secondaryLabel?: string;
};

function Bar3D({ color, heightPct }: { color: string; heightPct: number }) {
  const baseY = SVG_H;
  const frontTop = baseY - (heightPct / 100) * (SVG_H - SVG_DEPTH);
  const color1 = `color-mix(in srgb, ${color} 65%, white)`;
  const color2 = `color-mix(in srgb, ${color} 65%, black)`;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <polygon
        points={`${BAR_W},${frontTop} ${BAR_W},${baseY} ${BAR_W + SVG_DEPTH},${baseY - SVG_DEPTH} ${BAR_W + SVG_DEPTH},${frontTop - SVG_DEPTH}`}
        fill={color2}
      />
      <polygon
        points={`0,${frontTop} ${BAR_W},${frontTop} ${BAR_W + SVG_DEPTH},${frontTop - SVG_DEPTH} ${SVG_DEPTH},${frontTop - SVG_DEPTH}`}
        fill={color1}
      />
      <rect x={0} y={frontTop} width={BAR_W} height={baseY - frontTop} fill={color} />
    </svg>
  );
}

export function Bar3DChartInteractive({ items }: { items: Bar3DItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedItem = items.find((i) => i.label === expanded);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid items-end gap-1.5 pt-9" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col items-center">
            <button
              type="button"
              onClick={() => setExpanded((e) => (e === r.label ? null : r.label))}
              className="relative flex w-full items-end justify-center border-0 bg-transparent p-0"
              style={{ height: CHART_H_PX }}
              aria-label={`Ver detalle de ${r.label}`}
            >
              <span
                className="btm-fig absolute left-1/2 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
                style={{ bottom: `calc(${r.heightPct}% + ${DEPTH_PX + 3}px)`, transform: "translateX(-50%)" }}
                title={r.primaryLabel}
              >
                {r.primaryLabel}
              </span>
              <Bar3D color={r.color} heightPct={r.heightPct} />
            </button>
            {r.secondaryLabel && (
              <span className="btm-fig mt-1 max-w-full truncate text-[10px] font-semibold text-btm-black/60">
                {r.secondaryLabel}
              </span>
            )}
            <span
              className="mt-0.5 w-full truncate text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
              title={r.label}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>
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
            <li className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-btm-black/60">Monto</span>
              <span className="font-semibold">{expandedItem.primaryLabel}</span>
            </li>
            {expandedItem.secondaryLabel && (
              <li className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-btm-black/60">Toneladas</span>
                <span className="font-semibold">{expandedItem.secondaryLabel}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Apilada ---

export type StackedBand = {
  key: string;
  label: string;
  valueLabel: string;
  color: string;
  segTopY: number;
  segBaseY: number;
  labelBottomPct: number;
  pxHeight: number;
};

export type StackedColumnItem = {
  label: string;
  totalLabel: string;
  heightPct: number;
  bands: StackedBand[];
};

export type StackedLegendItem = { key: string; label: string; color: string };

function StackedBarSvg({ bands }: { bands: StackedBand[] }) {
  return (
    <>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
        aria-hidden
      >
        {bands.map((b) => {
          const color1 = `color-mix(in srgb, ${b.color} 65%, white)`;
          const color2 = `color-mix(in srgb, ${b.color} 65%, black)`;
          return (
            <g key={b.key}>
              <polygon
                points={`${BAR_W},${b.segTopY} ${BAR_W},${b.segBaseY} ${BAR_W + SVG_DEPTH},${b.segBaseY - SVG_DEPTH} ${BAR_W + SVG_DEPTH},${b.segTopY - SVG_DEPTH}`}
                fill={color2}
              />
              <polygon
                points={`0,${b.segTopY} ${BAR_W},${b.segTopY} ${BAR_W + SVG_DEPTH},${b.segTopY - SVG_DEPTH} ${SVG_DEPTH},${b.segTopY - SVG_DEPTH}`}
                fill={color1}
              />
              <rect x={0} y={b.segTopY} width={BAR_W} height={b.segBaseY - b.segTopY} fill={b.color} />
            </g>
          );
        })}
      </svg>
      {bands.map(
        (b) =>
          b.pxHeight >= STACKED_MIN_SEGMENT_LABEL_PX && (
            <span
              key={b.key}
              className="btm-fig pointer-events-none absolute left-1/2 max-w-full truncate px-0.5 text-center text-[9px] font-bold text-white"
              style={{ bottom: `${b.labelBottomPct}%`, transform: "translate(-50%, 50%)" }}
            >
              {b.valueLabel}
            </span>
          ),
      )}
    </>
  );
}

export function StackedBar3DChartInteractive({
  items,
  legend,
}: {
  items: StackedColumnItem[];
  legend: StackedLegendItem[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedItem = items.find((i) => i.label === expanded);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="grid min-w-0 flex-1 items-end gap-2"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, paddingTop: STACKED_GRID_PT_PX }}
        >
          {items.map((r) => (
            <div key={r.label} className="flex min-w-0 flex-col items-center">
              <button
                type="button"
                onClick={() => setExpanded((e) => (e === r.label ? null : r.label))}
                className="relative flex w-full items-end justify-center border-0 bg-transparent p-0"
                style={{ height: STACKED_CHART_H_PX }}
                aria-label={`Ver detalle de ${r.label}`}
              >
                <span
                  className="btm-fig absolute left-1/2 z-10 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
                  style={{ bottom: `calc(${r.heightPct}% + ${STACKED_DEPTH_OFFSET_PX}px)`, transform: "translateX(-50%)" }}
                  title={r.totalLabel}
                >
                  {r.totalLabel}
                </span>
                <StackedBarSvg bands={r.bands} />
              </button>
              <span
                className="mt-0.5 w-full truncate text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
                title={r.label}
              >
                {r.label}
              </span>
            </div>
          ))}
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
            {expandedItem.bands.map((b) => (
              <li key={b.key} className="flex items-center justify-between gap-3 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} aria-hidden />
                  <span className="truncate">{b.label}</span>
                </span>
                <span className="shrink-0 font-semibold">{b.valueLabel}</span>
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
