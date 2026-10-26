"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import { VendedorIcon, ZonaIcon, ProductoIcon } from "@/components/report-icons";
import type { AggregateRow } from "@/lib/reports/aggregate";

type SectionKey = "zona" | "producto" | "vendedor";

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "zona", label: "Top zonas", icon: <ZonaIcon /> },
  { key: "producto", label: "Top productos", icon: <ProductoIcon /> },
  { key: "vendedor", label: "Top vendedores", icon: <VendedorIcon /> },
];

export function TopSections({
  porZona,
  porProducto,
  porVendedor,
}: {
  porZona: AggregateRow[];
  porProducto: AggregateRow[];
  porVendedor: AggregateRow[];
}) {
  const [open, setOpen] = useState<SectionKey | null>(null);

  function toggle(key: SectionKey) {
    setOpen((prev) => (prev === key ? null : key));
  }

  const data: Record<SectionKey, AggregateRow[]> = { zona: porZona, producto: porProducto, vendedor: porVendedor };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => {
          const isOpen = open === section.key;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => toggle(section.key)}
              className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border px-4 py-6 text-center shadow-sm transition-shadow hover:shadow-md ${
                isOpen ? "border-btm-navy bg-btm-navy/5" : "border-black/10 bg-white"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isOpen ? "bg-btm-red text-white" : "bg-btm-red/10 text-btm-red group-hover:bg-btm-red group-hover:text-white"
                }`}
              >
                {section.icon}
              </span>
              <span className="font-display text-sm font-extrabold uppercase tracking-wide text-btm-navy">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
            {SECTIONS.find((s) => s.key === open)?.label}
          </h2>
          <TopBarChart rows={data[open]} />
        </section>
      )}
    </div>
  );
}

const TOP_BAR_CHART_N = 8;

// Un color distinto por barra — acá cada barra es una entidad individual
// (zona/producto/vendedor) ya identificada por su propia etiqueta debajo,
// así que el color no compite con una leyenda: es el look "Excel 3D" que
// pidió puntualmente el dueño para estos 3 gráficos.
const TOP_BAR_COLORS = ["#2a78d6", "#eb6834", "#e87ba4", "#eda100", "#1baf7a", "#4a3aa7", "#e34948", "#008300"];

// Geometría del prisma en coordenadas SVG exactas (nada de transform/skew
// aproximado) — así el tamaño del cubo, la posición del monto arriba y el
// punto donde "pisa" la barra quedan iguales para todas, sea cual sea su
// altura. CHART_H es la altura máxima de la cara frontal; DEPTH es el
// "espesor" del prisma; TEXT_H reserva arriba el lugar para el monto.
const CHART_H = 100;
const DEPTH = 7;
const BAR_W = 24;
const MIN_FRONT_H = 12;
const TEXT_H = 16;
const SVG_W = BAR_W + DEPTH;
const SVG_H = CHART_H + DEPTH + TEXT_H;

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

// Monto arriba de la barra (como parte del mismo SVG, para que nunca quede
// cortado contra el borde de la tarjeta) y toneladas + nombre abajo, en un
// renglón de altura fija para que un nombre de dos líneas no corra el
// resto del gráfico.
function TopBarChart({ rows }: { rows: AggregateRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin datos para este período.</p>;
  }

  const top = rows.slice(0, TOP_BAR_CHART_N);
  const max = Math.max(...top.map((r) => r.toneladas), 1);

  return (
    <div className="flex items-start justify-center gap-2 overflow-x-auto pb-1">
      {top.map((r, i) => {
        const color = TOP_BAR_COLORS[i % TOP_BAR_COLORS.length];
        const frontH = Math.round(Math.max((r.toneladas / max) * CHART_H, r.toneladas > 0 ? MIN_FRONT_H : 0));
        return (
          <div key={r.label} className="flex w-16 shrink-0 flex-col items-center">
            <Bar3D color={color} frontH={frontH} monto={formatUsd(r.total)} />
            <span className="btm-fig whitespace-nowrap text-[10px] font-semibold text-btm-black/60">
              {formatTn(r.toneladas)}
            </span>
            <span
              className="mt-0.5 line-clamp-2 h-7 text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
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

function Bar3D({ color, frontH, monto }: { color: string; frontH: number; monto: string }) {
  const baseY = SVG_H;
  const frontTop = baseY - frontH;
  const top = `color-mix(in srgb, ${color} 65%, white)`;
  const side = `color-mix(in srgb, ${color} 65%, black)`;

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ overflow: "visible" }}
      role="img"
      aria-label={`${monto}`}
    >
      <text
        x={SVG_W / 2}
        y={frontTop - DEPTH - 4}
        textAnchor="middle"
        className="btm-fig"
        fontSize="11"
        fontWeight="700"
        fill="#21305d"
      >
        {monto}
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
