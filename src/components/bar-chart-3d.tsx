export type Bar3DRow = { label: string; primary: number; secondary?: number };

// Un color distinto por barra — cada barra es una entidad individual ya
// identificada por su propia etiqueta debajo, así que el color no compite
// con una leyenda. Es el look "Excel 3D" que pidió el dueño, validado
// primero en Estadísticas y extendido acá a todos los demás gráficos de
// barras que puede ver.
export const BAR_COLORS = ["#2a78d6", "#eb6834", "#e87ba4", "#eda100", "#1baf7a", "#4a3aa7", "#e34948", "#008300"];

// El prisma (SVG, geometría exacta en coordenadas de viewBox) se estira
// libremente para llenar su columna — ahí no hay texto adentro, así que no
// importa que se distorsione un poco en una columna angosta. El valor y
// las etiquetas son HTML normal superpuesto, no texto SVG: así nunca se
// deforman ni se pisan entre columnas, solo se truncan si no entran (con
// "..." y el valor completo en el title).
const CHART_H_PX = 88;
const DEPTH_PX = 10;
const SVG_W = 60;
const SVG_H = 100;
const SVG_DEPTH = 12;
const BAR_W = 46;
const MIN_HEIGHT_PCT = 16;
const TOP_N_DEFAULT = 8;

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
        return (
          <div key={r.label} className="flex min-w-0 flex-col items-center">
            <div className="relative flex w-full items-end justify-center" style={{ height: CHART_H_PX }}>
              <span
                className="btm-fig absolute left-1/2 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
                style={{ bottom: `calc(${heightPct}% + ${DEPTH_PX + 3}px)`, transform: "translateX(-50%)" }}
                title={primaryLabel}
              >
                {primaryLabel}
              </span>
              <Bar3D color={color} heightPct={heightPct} />
            </div>
            {formatSecondary && r.secondary !== undefined && (
              <span className="btm-fig mt-1 max-w-full truncate text-[10px] font-semibold text-btm-black/60">
                {formatSecondary(r.secondary)}
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
      {/* cara lateral */}
      <polygon
        points={`${BAR_W},${frontTop} ${BAR_W},${baseY} ${BAR_W + SVG_DEPTH},${baseY - SVG_DEPTH} ${BAR_W + SVG_DEPTH},${frontTop - SVG_DEPTH}`}
        fill={color2}
      />
      {/* cara superior */}
      <polygon
        points={`0,${frontTop} ${BAR_W},${frontTop} ${BAR_W + SVG_DEPTH},${frontTop - SVG_DEPTH} ${SVG_DEPTH},${frontTop - SVG_DEPTH}`}
        fill={color1}
      />
      {/* cara frontal */}
      <rect x={0} y={frontTop} width={BAR_W} height={baseY - frontTop} fill={color} />
    </svg>
  );
}

// --- Gráfico de barras 3D apiladas (por sucursal, segmentado por producto) ---

export type StackedBar3DSegment = { key: string; label: string; value: number; color: string };
export type StackedBar3DRow = { label: string; total: number; segments: StackedBar3DSegment[] };
export type StackedBar3DLegendItem = { key: string; label: string; color: string };

const STACKED_CHART_H_PX = 220;
const STACKED_MIN_SEGMENT_LABEL_PX = 16;

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
        className="grid min-w-0 flex-1 items-end gap-2 pt-9"
        style={{ gridTemplateColumns: `repeat(${visibleRows.length}, minmax(0, 1fr))` }}
      >
        {visibleRows.map((r) => {
          const heightPct = Math.max((r.total / max) * 100, r.total > 0 ? MIN_HEIGHT_PCT : 0);
          const totalLabel = formatTotal(r.total);
          return (
            <div key={r.label} className="flex min-w-0 flex-col items-center">
              <div className="relative flex w-full items-end justify-center" style={{ height: STACKED_CHART_H_PX }}>
                <span
                  className="btm-fig absolute left-1/2 max-w-full truncate px-0.5 text-[10px] font-bold text-btm-navy"
                  style={{ bottom: `calc(${heightPct}% + ${DEPTH_PX + 3}px)`, transform: "translateX(-50%)" }}
                  title={totalLabel}
                >
                  {totalLabel}
                </span>
                <StackedBar3D segments={r.segments} total={r.total} heightPct={heightPct} formatSegment={formatSegment} />
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

function StackedBar3D({
  segments,
  total,
  heightPct,
  formatSegment,
}: {
  segments: StackedBar3DSegment[];
  total: number;
  heightPct: number;
  formatSegment: (value: number) => string;
}) {
  const baseY = SVG_H;
  const totalFrontHeight = (heightPct / 100) * (SVG_H - SVG_DEPTH);

  let cumHeight = 0;
  const bands = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = total > 0 ? s.value / total : 0;
      const segHeight = totalFrontHeight * frac;
      const segBaseY = baseY - cumHeight;
      const segTopY = segBaseY - segHeight;
      cumHeight += segHeight;
      const midY = (segTopY + segBaseY) / 2;
      const labelBottomPct = ((SVG_H - midY) / SVG_H) * 100;
      const pxHeight = (segHeight / SVG_H) * STACKED_CHART_H_PX;
      return { ...s, segTopY, segBaseY, labelBottomPct, pxHeight };
    });

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
              title={`${b.label}: ${formatSegment(b.value)}`}
            >
              {formatSegment(b.value)}
            </span>
          ),
      )}
    </>
  );
}
