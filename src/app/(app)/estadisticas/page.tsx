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
  const { logistica, produccion } = estadoCounts(orders);

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
        <MonthlyChart data={porMes} />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EstadoSplit
          title="Estado del pedido"
          items={[
            { label: "Pendiente", value: logistica.PENDIENTE, className: "bg-btm-pendiente" },
            { label: "Parcial", value: logistica.PARCIAL, className: "bg-btm-parcial" },
            { label: "Entregado", value: logistica.ENTREGADO, className: "bg-btm-entregado" },
          ]}
        />
        <EstadoSplit
          title="Estado de producción"
          items={[
            { label: "Pendiente", value: produccion.PENDIENTE, className: "bg-btm-pendiente" },
            { label: "Parcial", value: produccion.PARCIAL, className: "bg-btm-parcial" },
            { label: "Fabricado", value: produccion.FABRICADO, className: "bg-btm-fabricado" },
          ]}
        />
      </div>

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
          <PendingProductBars rows={rows} />
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

const PENDING_BARS_TOP_N = 5;

function PendingProductBars({ rows }: { rows: AggregateRow[] }) {
  const top = rows.slice(0, PENDING_BARS_TOP_N);
  const max = Math.max(...top.map((r) => r.total), 1);

  return (
    <div className="flex flex-col gap-2">
      {top.map((row) => {
        const pct = Math.max((row.total / max) * 100, row.total > 0 ? 2 : 0);
        return (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-xs text-btm-black/70 sm:w-28" title={row.label}>
              {row.label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/[.04]">
              <div
                className="h-full rounded-full bg-btm-navy"
                style={{ width: `${pct}%` }}
                role="img"
                aria-label={`${row.label}: ${formatUsd(row.total)}, ${formatTn(row.toneladas)}`}
              />
            </div>
            <span className="btm-fig w-16 shrink-0 text-right text-[11px] font-semibold text-btm-navy sm:w-20">
              {formatUsd(row.total)}
            </span>
            <span className="btm-fig w-12 shrink-0 text-right text-[11px] font-semibold text-btm-navy sm:w-16">
              {formatTn(row.toneladas)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyChart({ data }: { data: { label: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin datos para este período.</p>;
  }

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-[40px] flex-1 flex-col items-center gap-1.5">
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-t-md bg-btm-navy"
              style={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 4 : 0)}%` }}
              title={formatUsd(d.total)}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-btm-black/50">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function EstadoSplit({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; className: string }[];
}) {
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-black/5">
        {items.map((item) => (
          <div
            key={item.label}
            className={item.className}
            style={{ width: total > 0 ? `${(item.value / total) * 100}%` : 0 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-btm-black/70">
            <span className={`h-2 w-2 rounded-full ${item.className}`} aria-hidden />
            {item.label}: {item.value} ({percent(item.value, total)}%)
          </span>
        ))}
      </div>
    </section>
  );
}
