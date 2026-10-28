"use client";

// Piezas interactivas (tap para ver el detalle completo en un globo) de los
// gráficos de barras 3D. Separado de bar-chart-3d.tsx a propósito: ese
// archivo sigue siendo un Server Component que recibe funciones de formato
// (formatPrimary, formatSegment, etc.) — pasarlas como prop a un Client
// Component rompe la serialización de RSC (ya nos pasó una vez con
// MovimientosTable). Acá solo llegan strings y números ya formateados.

import { Fragment, useState } from "react";
import {
  BAR_W,
  CHART_H_PX,
  DEPTH_PX,
  STACKED_MIN_SEGMENT_LABEL_PX,
  SVG_DEPTH,
  SVG_H,
  SVG_W,
} from "./bar-chart-3d-constants";

function TapTooltip({ text, bottom }: { text: string; bottom: string }) {
  return (
    <span
      className="btm-fig pointer-events-none absolute left-1/2 z-20 max-w-[160px] -translate-x-1/2 whitespace-normal rounded-md bg-btm-navy px-2 py-1 text-center text-[10px] font-semibold text-white shadow-lg"
      style={{ bottom }}
    >
      {text}
    </span>
  );
}

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

export function TapToggleBar({
  color,
  heightPct,
  primaryLabel,
  tooltipText,
}: {
  color: string;
  heightPct: number;
  primaryLabel: string;
  tooltipText: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setActive((a) => !a)}
      className="relative flex w-full items-end justify-center border-0 bg-transparent p-0"
      style={{ height: CHART_H_PX }}
      aria-label={tooltipText}
    >
      <span
        className="btm-fig absolute left-1/2 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
        style={{ bottom: `calc(${heightPct}% + ${DEPTH_PX + 3}px)`, transform: "translateX(-50%)" }}
        title={primaryLabel}
      >
        {primaryLabel}
      </span>
      {active && <TapTooltip text={tooltipText} bottom={`calc(${heightPct}% + ${DEPTH_PX + 21}px)`} />}
      <Bar3D color={color} heightPct={heightPct} />
    </button>
  );
}

export type StackedBand = {
  key: string;
  label: string;
  valueLabel: string;
  tooltipText: string;
  color: string;
  segTopY: number;
  segBaseY: number;
  labelBottomPct: number;
  pxHeight: number;
};

export function StackedBarColumn({ bands }: { bands: StackedBand[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  function toggle(key: string) {
    setActiveKey((k) => (k === key ? null : key));
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
      >
        {bands.map((b) => {
          const color1 = `color-mix(in srgb, ${b.color} 65%, white)`;
          const color2 = `color-mix(in srgb, ${b.color} 65%, black)`;
          return (
            <g
              key={b.key}
              role="button"
              tabIndex={0}
              aria-label={b.tooltipText}
              style={{ cursor: "pointer" }}
              onClick={() => toggle(b.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(b.key);
                }
              }}
            >
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
      {bands.map((b) => {
        const isActive = activeKey === b.key;
        return (
          <Fragment key={b.key}>
            {b.pxHeight >= STACKED_MIN_SEGMENT_LABEL_PX && !isActive && (
              <span
                className="btm-fig pointer-events-none absolute left-1/2 max-w-full truncate px-0.5 text-center text-[9px] font-bold text-white"
                style={{ bottom: `${b.labelBottomPct}%`, transform: "translate(-50%, 50%)" }}
                title={b.tooltipText}
              >
                {b.valueLabel}
              </span>
            )}
            {isActive && <TapTooltip text={b.tooltipText} bottom={`calc(${b.labelBottomPct}% + 14px)`} />}
          </Fragment>
        );
      })}
    </>
  );
}
