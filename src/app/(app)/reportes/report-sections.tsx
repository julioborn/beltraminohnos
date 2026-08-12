"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import { ClienteIcon, VendedorIcon, ZonaIcon, ProductoIcon } from "@/components/report-icons";
import type { AggregateRow, ProductAggregateRow } from "@/lib/reports/aggregate";

type SectionKey = "cliente" | "vendedor" | "zona" | "producto";

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "cliente", label: "Ventas por cliente", icon: <ClienteIcon /> },
  { key: "vendedor", label: "Ventas por vendedor", icon: <VendedorIcon /> },
  { key: "zona", label: "Ventas por zona", icon: <ZonaIcon /> },
  { key: "producto", label: "Ventas por producto", icon: <ProductoIcon /> },
];

export function ReportSections({
  porCliente,
  porVendedor,
  porZona,
  porProducto,
}: {
  porCliente: AggregateRow[];
  porVendedor: AggregateRow[];
  porZona: AggregateRow[];
  porProducto: ProductAggregateRow[];
}) {
  const [open, setOpen] = useState<SectionKey | null>(null);

  function toggle(key: SectionKey) {
    setOpen((prev) => (prev === key ? null : key));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <span className="font-display text-xs font-extrabold uppercase tracking-wide text-btm-navy sm:text-sm">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {open === "cliente" && <ReportTable title="Ventas por cliente" rows={porCliente} />}
      {open === "vendedor" && <ReportTable title="Ventas por vendedor" rows={porVendedor} />}
      {open === "zona" && <ReportTable title="Ventas por zona" rows={porZona} />}
      {open === "producto" && <ProductTable title="Ventas por producto" rows={porProducto} />}
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: AggregateRow[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5 text-right">Notas</th>
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="max-w-0 truncate px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2 text-right text-btm-black/70">{row.count}</td>
                <td className="px-3 py-2 text-right font-semibold text-btm-navy">{formatUsd(row.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-btm-black/50">
                  Sin datos para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductTable({ title, rows }: { title: string; rows: ProductAggregateRow[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-right">Cantidad (tn)</th>
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="max-w-0 truncate px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2 text-right text-btm-black/70">
                  {row.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-btm-navy">{formatUsd(row.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-btm-black/50">
                  Sin datos para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
