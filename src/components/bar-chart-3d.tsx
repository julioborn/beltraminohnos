export type Bar3DRow = { label: string; primary: number; secondary?: number };

// Un color distinto por barra — cada barra es una entidad individual ya
// identificada por su propia etiqueta debajo, así que el color no compite
// con una leyenda. Es el look "Excel 3D" que pidió el dueño, validado
// primero en Estadísticas y extendido acá a todos los demás gráficos de
// barras que puede ver.
const BAR_COLORS = ["#2a78d6", "#eb6834", "#e87ba4", "#eda100", "#1baf7a", "#4a3aa7", "#e34948", "#008300"];

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
