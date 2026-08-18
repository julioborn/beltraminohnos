import Link from "next/link";
import { getOrdersForReports, getOrderNotesList, type ReportFilters } from "@/lib/data/orders";
import {
  aggregateByMonth,
  aggregateByProducto,
  aggregateByVendedor,
  aggregateByZona,
  estadoCounts,
  totalFacturado,
} from "@/lib/reports/aggregate";
import { formatUsd, formatFecha } from "@/lib/format";
import { TopSections } from "./top-sections";

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<ReportFilters>;
}) {
  const params = await searchParams;
  const [orders, pendientesFabricacion, pendientesEntrega] = await Promise.all([
    getOrdersForReports(params),
    getOrderNotesList({ estado_produccion: "PENDIENTE" }),
    getOrderNotesList({ estado_logistica: "PENDIENTE" }),
  ]);
  const hasFilter = Boolean(params.desde || params.hasta);

  const total = totalFacturado(orders);
  const cantidadNotas = orders.length;
  const ticketPromedio = cantidadNotas > 0 ? total / cantidadNotas : 0;

  const porMes = aggregateByMonth(orders).slice(-12);
  const porZona = aggregateByZona(orders).slice(0, 6);
  const porProducto = aggregateByProducto(orders).slice(0, 6);
  const porVendedor = aggregateByVendedor(orders).slice(0, 6);
  const { logistica, produccion } = estadoCounts(orders);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">Estadísticas</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PendingNotesCard title="Pendientes de fabricación" notes={pendientesFabricacion} emptyLabel="No hay notas pendientes de fabricación." />
        <PendingNotesCard title="Pendientes de entrega" notes={pendientesEntrega} emptyLabel="No hay notas pendientes de entrega." />
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
        <Kpi label="Ticket promedio" value={formatUsd(ticketPromedio)} />
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
            { label: "Entregado", value: logistica.ENTREGADO, className: "bg-btm-entregado" },
          ]}
        />
        <EstadoSplit
          title="Estado de producción"
          items={[
            { label: "Pendiente", value: produccion.PENDIENTE, className: "bg-btm-pendiente" },
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
  notes,
  emptyLabel,
}: {
  title: string;
  notes: { id: string; numero: string; cliente: string; fecha: string }[];
  emptyLabel: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
        <span className="rounded-full bg-btm-pendiente-bg px-2.5 py-1 text-xs font-bold text-amber-900">
          {notes.length}
        </span>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-btm-black/50">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col divide-y divide-black/5">
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
      )}
    </section>
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
