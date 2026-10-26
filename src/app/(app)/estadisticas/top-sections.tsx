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

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

// Monto arriba de la barra, toneladas y la etiqueta abajo — es lo que pidió
// el dueño puntualmente para estos 3 gráficos (zona/producto/vendedor), a
// diferencia del resto de los gráficos horizontales de la app.
function TopBarChart({ rows }: { rows: AggregateRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin datos para este período.</p>;
  }

  const top = rows.slice(0, TOP_BAR_CHART_N);
  const max = Math.max(...top.map((r) => r.toneladas), 1);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {top.map((r) => (
        <div key={r.label} className="flex min-w-[72px] flex-1 flex-col items-center gap-1.5">
          <span className="btm-fig whitespace-nowrap text-xs font-bold text-btm-navy">{formatUsd(r.total)}</span>
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-t-md bg-btm-navy"
              style={{ height: `${Math.max((r.toneladas / max) * 100, r.toneladas > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="btm-fig whitespace-nowrap text-[10px] font-semibold text-btm-black/60">
            {formatTn(r.toneladas)}
          </span>
          <span
            className="text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50"
            title={r.label}
          >
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}
