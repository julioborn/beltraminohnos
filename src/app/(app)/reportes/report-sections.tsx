"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";
import { ClienteIcon, VendedorIcon, ZonaIcon, ProductoIcon } from "@/components/report-icons";
import { Bar3DChart } from "@/components/bar-chart-3d";
import type { AggregateRow } from "@/lib/reports/aggregate";

type SectionKey = "cliente" | "vendedor" | "zona" | "producto";

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "cliente", label: "Ventas por cliente", icon: <ClienteIcon /> },
  { key: "vendedor", label: "Ventas por vendedor", icon: <VendedorIcon /> },
  { key: "zona", label: "Ventas por zona", icon: <ZonaIcon /> },
  { key: "producto", label: "Ventas por producto", icon: <ProductoIcon /> },
];

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

export function ReportSections({
  porCliente,
  porVendedor,
  porZona,
  porProducto,
}: {
  porCliente: AggregateRow[];
  porVendedor: AggregateRow[];
  porZona: AggregateRow[];
  porProducto: AggregateRow[];
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

      {open === "cliente" && (
        <div className="flex flex-col gap-4">
          <ReportChart label="clientes" rows={porCliente} />
          <ReportTable title="Ventas por cliente" nameColumn="Cliente" rows={porCliente} />
        </div>
      )}
      {open === "vendedor" && (
        <div className="flex flex-col gap-4">
          <ReportChart label="vendedores" rows={porVendedor} />
          <ReportTable title="Ventas por vendedor" nameColumn="Vendedor" rows={porVendedor} />
        </div>
      )}
      {open === "zona" && (
        <div className="flex flex-col gap-4">
          <ReportChart label="zonas" rows={porZona} />
          <ReportTable title="Ventas por zona" nameColumn="Zona" rows={porZona} />
        </div>
      )}
      {open === "producto" && (
        <div className="flex flex-col gap-4">
          <ReportChart label="productos" rows={porProducto} />
          <ReportTable title="Ventas por producto" nameColumn="Producto" rows={porProducto} />
        </div>
      )}
    </div>
  );
}

function sumToneladas(rows: AggregateRow[]) {
  return rows.reduce((sum, r) => sum + r.toneladas, 0);
}

function sumTotal(rows: AggregateRow[]) {
  return rows.reduce((sum, r) => sum + r.total, 0);
}

const REPORT_PAGE_SIZE = 20;

function ReportPager({
  page,
  totalPages,
  totalRows,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs text-btm-black/50">
        Página {page} de {totalPages} · {totalRows} resultados
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer rounded-md border border-black/15 px-3 py-1.5 text-xs font-semibold text-btm-black/70 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer rounded-md border border-black/15 px-3 py-1.5 text-xs font-semibold text-btm-black/70 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function ReportTable({ title, nameColumn, rows }: { title: string; nameColumn: string; rows: AggregateRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / REPORT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * REPORT_PAGE_SIZE, currentPage * REPORT_PAGE_SIZE);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-black/10">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">{nameColumn}</th>
              <th className="px-3 py-2.5 text-right">Toneladas</th>
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {pageRows.map((row) => (
              <tr key={row.label}>
                <td className="max-w-0 truncate px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2 text-right text-btm-black/70">{formatTn(row.toneladas)}</td>
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
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-btm-navy/20 bg-btm-navy/5">
                <td className="px-3 py-2.5 font-display text-xs font-extrabold uppercase tracking-wide text-btm-navy">Total</td>
                <td className="px-3 py-2.5 text-right font-semibold text-btm-navy">{formatTn(sumToneladas(rows))}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-btm-navy">{formatUsd(sumTotal(rows))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <ReportPager page={currentPage} totalPages={totalPages} totalRows={rows.length} onPageChange={setPage} />
    </section>
  );
}

const CHART_TOP_N = 10;

function ReportChart({ label, rows }: { label: string; rows: AggregateRow[] }) {
  if (rows.length === 0) return null;
  const title = `Top ${Math.min(rows.length, CHART_TOP_N)} ${label}`;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      <Bar3DChart
        rows={rows.map((r) => ({ label: r.label, primary: r.total, secondary: r.toneladas }))}
        topN={CHART_TOP_N}
        formatPrimary={formatUsd}
        formatSecondary={formatTn}
      />
    </section>
  );
}
