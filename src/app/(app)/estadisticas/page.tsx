import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getOrdersForReports, getOrdersPendingSummary, type ReportFilters } from "@/lib/data/orders";
import {
  aggregateByMonth,
  aggregateByProducto,
  aggregateByVendedor,
  aggregateByZona,
  aggregatePendingByProducto,
  estadoCounts,
  totalFacturado,
  totalToneladas,
  type AggregateRow,
} from "@/lib/reports/aggregate";
import { formatUsd, formatFecha } from "@/lib/format";
import { Bar3DChart } from "@/components/bar-chart-3d";
import { TopSections } from "./top-sections";

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<ReportFilters>;
}) {
  if (!hasFullAccess(await getProfileRole())) {
    redirect("/inicio");
  }

  const params = await searchParams;
  const [orders, pendingOrders] = await Promise.all([getOrdersForReports(params), getOrdersPendingSummary()]);
  const hasFilter = Boolean(params.desde || params.hasta);

  const total = totalFacturado(orders);
  const cantidadNotas = orders.length;
  const toneladasVendidas = totalToneladas(orders);
  const promedioPorTonelada = toneladasVendidas > 0 ? total / toneladasVendidas : 0;

  const pendientesFabricacionRows = aggregatePendingByProducto(pendingOrders, "estado_produccion");
  const pendientesEntregaRows = aggregatePendingByProducto(pendingOrders, "estado_logistica");
  const pendientesFabricacionNotas = notesWithPending(pendingOrders, "estado_produccion");
  const pendientesEntregaNotas = notesWithPending(pendingOrders, "estado_logistica");

  const porMes = aggregateByMonth(orders).slice(-12);
  const porZona = aggregateByZona(orders).slice(0, 6);
  const porProducto = aggregateByProducto(orders).slice(0, 6);
  const porVendedor = aggregateByVendedor(orders).slice(0, 6);
  const { logistica } = estadoCounts(orders);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">Estadísticas</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PendingNotesCard
          title="Pendientes de fabricación"
          rows={pendientesFabricacionRows}
          notes={pendientesFabricacionNotas}
          emptyLabel="No hay nada pendiente de fabricación."
        />
        <PendingNotesCard
          title="Pendientes de entrega"
          rows={pendientesEntregaRows}
          notes={pendientesEntregaNotas}
          emptyLabel="No hay nada pendiente de entrega."
        />
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
              href="/estadisticas"
              className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Notas" value={String(cantidadNotas)} />
        <Kpi label="Total facturado" value={formatUsd(total)} />
        <Kpi label="Promedio por tonelada" value={`${formatUsd(promedioPorTonelada)}/tn`} />
        <Kpi label="Entregado" value={`${percent(logistica.ENTREGADO, cantidadNotas)}%`} />
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Facturación mensual</h2>
        <Bar3DChart
          rows={porMes.map((d) => ({ label: d.label, primary: d.total }))}
          topN={porMes.length}
          formatPrimary={formatUsd}
        />
      </section>

      <TopSections porZona={porZona} porProducto={porProducto} porVendedor={porVendedor} />
    </div>
  );
}

function percent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

function notesWithPending(
  orders: { id: string; numero: string; cliente: string; fecha: string; items: { estado_produccion: string; estado_logistica: string }[] }[],
  campo: "estado_produccion" | "estado_logistica",
) {
  return orders
    .filter((o) => o.items.some((it) => it[campo] === "PENDIENTE"))
    .map((o) => ({ id: o.id, numero: o.numero, cliente: o.cliente, fecha: o.fecha }));
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</p>
      <p className="font-display text-xl font-extrabold text-btm-navy sm:text-2xl">{value}</p>
    </div>
  );
}

function PendingNotesCard({
  title,
  rows,
  notes,
  emptyLabel,
}: {
  title: string;
  rows: AggregateRow[];
  notes: { id: string; numero: string; cliente: string; fecha: string }[];
  emptyLabel: string;
}) {
  const toneladas = rows.reduce((sum, r) => sum + r.toneladas, 0);
  const monto = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-btm-black/50">{emptyLabel}</p>
      ) : (
        <>
          <p className="text-sm text-btm-black/70">
            <span className="font-bold text-btm-navy">{formatUsd(monto)}</span> · {formatTn(toneladas)}
          </p>
          <Bar3DChart
            rows={rows.slice(0, 5).map((r) => ({ label: r.label, primary: r.total, secondary: r.toneladas }))}
            formatPrimary={formatUsd}
            formatSecondary={formatTn}
          />
          <details className="group">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy [&::-webkit-details-marker]:hidden">
              <svg
                className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path d="M6 4l6 6-6 6V4z" />
              </svg>
              Ver notas ({notes.length})
            </summary>
            <div className="mt-2 flex max-h-80 flex-col divide-y divide-black/5 overflow-y-auto">
              {notes.map((n) => (
                <Link
                  key={n.id}
                  href={`/pedidos/${n.id}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm hover:text-btm-red"
                >
                  <span className="flex flex-col">
                    <span className="font-semibold text-btm-navy">{n.numero}</span>
                    <span className="text-btm-black/70">{n.cliente}</span>
                  </span>
                  <span className="shrink-0 text-xs text-btm-black/50">{formatFecha(n.fecha)}</span>
                </Link>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}

