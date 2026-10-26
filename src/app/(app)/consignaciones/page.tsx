import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getSucursales, getResumenSucursal } from "@/lib/data/consignaciones";
import { EmpresaSelect } from "./empresa-select";

export default async function ConsignacionesResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const role = await getProfileRole();
  if (!hasFullAccess(role) && role !== "contable") {
    redirect("/inicio");
  }

  const params = await searchParams;
  const sucursales = await getSucursales();

  if (sucursales.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Header />
        <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
          Todavía no hay sucursales cargadas.
        </p>
      </div>
    );
  }

  const sucursalId = sucursales.some((s) => s.id === params.sucursal) ? params.sucursal! : sucursales[0].id;
  const sucursal = sucursales.find((s) => s.id === sucursalId)!;
  const resumen = await getResumenSucursal(sucursalId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <Header />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4">
        <EmpresaSelect sucursales={sucursales} selected={sucursalId} />
      </div>

      <section className="flex flex-col gap-3">
        {resumen.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            {sucursal.name} no tiene movimientos cargados todavía.
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <StockFisicoChart rows={resumen} />
            </div>
            <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                <tr>
                  <th className="px-3 py-2.5">{sucursal.name}</th>
                  <th className="px-3 py-2.5 text-right">Stock inicio</th>
                  <th className="px-3 py-2.5 text-right">Vtas sucursal pendientes</th>
                  <th className="px-3 py-2.5 text-right">Vtas directas pendientes</th>
                  <th className="px-3 py-2.5 text-right">Stock físico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {resumen.map((r) => (
                  <tr key={r.productId}>
                    <td className="px-3 py-2.5 font-semibold text-btm-navy">{r.productName}</td>
                    <td className="px-3 py-2.5 text-right">{r.stockInicio.toLocaleString("es-AR")}</td>
                    <td className="px-3 py-2.5 text-right">{r.ventasSucursalPendientes.toLocaleString("es-AR")}</td>
                    <td className="px-3 py-2.5 text-right">{r.ventasDirectasPendientes.toLocaleString("es-AR")}</td>
                    <td className="px-3 py-2.5 text-right">{r.stockFisico.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const STOCK_CHART_TOP_N = 10;

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

function StockFisicoChart({ rows }: { rows: { productName: string; stockFisicoToneladas: number }[] }) {
  const sorted = [...rows].sort((a, b) => b.stockFisicoToneladas - a.stockFisicoToneladas);
  const top = sorted.slice(0, STOCK_CHART_TOP_N);
  const max = Math.max(...top.map((r) => Math.abs(r.stockFisicoToneladas)), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 sm:w-32" />
        <span className="flex-1" />
        <span className="w-20 shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-btm-black/50 sm:w-24">
          Toneladas
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {top.map((row) => {
          const pct = Math.max((Math.abs(row.stockFisicoToneladas) / max) * 100, row.stockFisicoToneladas !== 0 ? 2 : 0);
          return (
            <div key={row.productName} className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-xs text-btm-black/70 sm:w-32" title={row.productName}>
                {row.productName}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/[.04]">
                <div
                  className="h-full rounded-full bg-btm-navy"
                  style={{ width: `${pct}%` }}
                  role="img"
                  aria-label={`${row.productName}: ${formatTn(row.stockFisicoToneladas)}`}
                />
              </div>
              <span className="btm-fig w-20 shrink-0 truncate text-right text-xs font-semibold text-btm-navy sm:w-24">
                {formatTn(row.stockFisicoToneladas)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Consignaciones
        </h1>
        <p className="text-sm text-btm-black/60">Resumen por empresa</p>
      </div>
      <Link
        href="/consignaciones/panel"
        className="rounded-full bg-btm-navy px-5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
      >
        Consignaciones
      </Link>
    </div>
  );
}
