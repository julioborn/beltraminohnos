"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import { BarList } from "@/components/bar-list";
import { VendedorIcon, ZonaIcon, ProductoIcon } from "@/components/report-icons";

type Row = { label: string; total: number };
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
  porZona: Row[];
  porProducto: Row[];
  porVendedor: Row[];
}) {
  const [open, setOpen] = useState<SectionKey | null>(null);

  function toggle(key: SectionKey) {
    setOpen((prev) => (prev === key ? null : key));
  }

  const data: Record<SectionKey, Row[]> = { zona: porZona, producto: porProducto, vendedor: porVendedor };

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
          <BarList rows={data[open].map((r) => ({ label: r.label, value: r.total }))} formatValue={formatUsd} />
        </section>
      )}
    </div>
  );
}
