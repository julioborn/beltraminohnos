export type Bar3DRow = { label: string; primary: number; secondary?: number };

// Un color distinto por barra — cada barra es una entidad individual ya
// identificada por su propia etiqueta debajo, así que el color no compite
// con una leyenda. Es el look "Excel 3D" que pidió el dueño, validado
// primero en Estadísticas y extendido acá a todos los demás gráficos de
// barras que puede ver.
const BAR_COLORS = ["#2a78d6", "#eb6834", "#e87ba4", "#eda100", "#1baf7a", "#4a3aa7", "#e34948", "#008300"];

// Geometría del prisma en coordenadas SVG exactas (nada de transform/skew
// aproximado) — así el tamaño del cubo, la posición del valor arriba y el
// punto donde "pisa" la barra quedan iguales para todas, sea cual sea su
// altura. CHART_H es la altura máxima de la cara frontal; DEPTH es el
// "espesor" del prisma; TEXT_H reserva arriba el lugar para la etiqueta.
// El SVG se renderiza al 100% del ancho de su columna (grid de a 1fr por
// barra) en vez de con un ancho fijo en px — así el gráfico entero siempre
// entra en el ancho disponible, sin scroll horizontal, sea cual sea la
// cantidad de barras.
const CHART_H = 180;
const DEPTH = 12;
const BAR_W = 44;
const MIN_FRONT_H = 20;
const TEXT_H = 26;
const SVG_W = BAR_W + DEPTH;
const SVG_H = CHART_H + DEPTH + TEXT_H;
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
    <div className="grid items-end gap-3" style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))` }}>
      {top.map((r, i) => {
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const frontH = Math.round(Math.max((r.primary / max) * CHART_H, r.primary > 0 ? MIN_FRONT_H : 0));
        return (
          <div key={r.label} className="flex min-w-0 flex-col items-center">
            <Bar3D color={color} frontH={frontH} primaryLabel={formatPrimary(r.primary)} />
            {formatSecondary && r.secondary !== undefined && (
              <span className="btm-fig mt-1 max-w-full truncate text-xs font-semibold text-btm-black/60">
                {formatSecondary(r.secondary)}
              </span>
            )}
            <span className="mt-1 w-full text-center text-xs leading-snug font-semibold break-words uppercase tracking-wide text-btm-black/50">
              {r.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Bar3D({ color, frontH, primaryLabel }: { color: string; frontH: number; primaryLabel: string }) {
  const baseY = SVG_H;
  const frontTop = baseY - frontH;
  const top = `color-mix(in srgb, ${color} 65%, white)`;
  const side = `color-mix(in srgb, ${color} 65%, black)`;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="none"
      className="h-52 w-full"
      style={{ overflow: "visible" }}
      role="img"
      aria-label={primaryLabel}
    >
      <text
        x={SVG_W / 2}
        y={frontTop - DEPTH - 6}
        textAnchor="middle"
        className="btm-fig"
        fontSize="15"
        fontWeight="700"
        fill="#21305d"
      >
        {primaryLabel}
      </text>
      {/* cara lateral */}
      <polygon
        points={`${BAR_W},${frontTop} ${BAR_W},${baseY} ${BAR_W + DEPTH},${baseY - DEPTH} ${BAR_W + DEPTH},${frontTop - DEPTH}`}
        fill={side}
      />
      {/* cara superior */}
      <polygon
        points={`0,${frontTop} ${BAR_W},${frontTop} ${BAR_W + DEPTH},${frontTop - DEPTH} ${DEPTH},${frontTop - DEPTH}`}
        fill={top}
      />
      {/* cara frontal */}
      <rect x={0} y={frontTop} width={BAR_W} height={frontH} fill={color} />
    </svg>
  );
}
