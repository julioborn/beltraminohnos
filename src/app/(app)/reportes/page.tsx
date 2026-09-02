import Link from "next/link";
import { getOrdersForReports, type ReportFilters } from "@/lib/data/orders";
import {
  aggregateByCliente,
  aggregateByProducto,
  aggregateByVendedor,
  aggregateByZona,
  totalFacturado,
} from "@/lib/reports/aggregate";
import { formatUsd } from "@/lib/format";
import { ReportSections } from "./report-sections";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<ReportFilters>;
}) {
  const params = await searchParams;
  const orders = await getOrdersForReports(params);
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const hasFilter = Boolean(params.desde || params.hasta);

  const total = totalFacturado(orders);
  const porCliente = aggregateByCliente(orders);
  const porVendedor = aggregateByVendedor(orders);
  const porZona = aggregateByZona(orders);
  const porProducto = aggregateByProducto(orders);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">Reportes</h1>
          <p className="text-sm text-btm-black/60">
            {orders.length} {orders.length === 1 ? "nota" : "notas"} · Total {formatUsd(total)}
          </p>
        </div>
        <a
          href={`/reportes/export/excel${qs ? `?${qs}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          Exportar Excel
        </a>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Desde
          </label>
          <input id="desde" type="date" name="desde" defaultValue={params.desde} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Hasta
          </label>
          <input id="hasta" type="date" name="hasta" defaultValue={params.hasta} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red">
            Filtrar
          </button>
          {hasFilter && (
            <Link
              href="/reportes"
              className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <ReportSections porCliente={porCliente} porVendedor={porVendedor} porZona={porZona} porProducto={porProducto} />
    </div>
  );
}
