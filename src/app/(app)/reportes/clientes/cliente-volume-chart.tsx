// Gráfico de área mensual (toneladas), a mano con SVG — sin librería, y sin
// "use client": no hace falta ninguna interacción acá (a diferencia de los
// gráficos de Consignaciones, esto no tiene un panel de detalle táctil
// porque la tabla de abajo ya muestra el desglose completo), así que evita
// por completo la clase de bug de pasar funciones de formato a un Client
// Component que ya pasó un par de veces en Consignaciones.

import type { MesVolumen } from "@/lib/reports/cliente-report";

const W = 760;
const H = 220;
const PAD_X = 24;
const PAD_TOP = 36;
const PAD_BOTTOM = 28;

export function ClienteVolumeChart({
  data,
  titulo,
  subtitulo,
}: {
  data: MesVolumen[];
  titulo: string;
  subtitulo?: string;
}) {
  const max = Math.max(...data.map((d) => d.toneladas), 1);
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PAD_X + step * i;
    const y = PAD_TOP + plotH - (d.toneladas / max) * plotH;
    return { x, y, d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + plotH} L ${points[0].x} ${PAD_TOP + plotH} Z`;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy">{titulo}</h3>
        {subtitulo && <p className="text-[11px] text-btm-black/50">{subtitulo}</p>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={titulo}>
        <line x1={PAD_X} y1={PAD_TOP + plotH} x2={W - PAD_X} y2={PAD_TOP + plotH} stroke="rgba(0,0,0,0.1)" />
        <path d={areaPath} fill="var(--btm-navy)" opacity={0.15} />
        <path d={linePath} fill="none" stroke="var(--btm-navy)" strokeWidth={2} />
        {points.map((p) => (
          <g key={p.d.mes}>
            <circle cx={p.x} cy={p.y} r={3} fill="var(--btm-navy)" />
            {p.d.toneladas > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--btm-navy)">
                {p.d.toneladas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
              </text>
            )}
            <text x={p.x} y={H - 8} textAnchor="middle" fontSize={11} fill="rgba(55,53,52,0.5)">
              {p.d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
