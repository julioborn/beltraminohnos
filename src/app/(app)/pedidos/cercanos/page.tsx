import Link from "next/link";
import { getOrderNotesNearby, type NearbyFilters } from "@/lib/data/nearby";
import { LogisticaBadge, ProduccionBadge } from "@/components/estado-badge";
import { ClickableRow } from "@/components/clickable-row";
import { RowLink } from "@/components/row-link";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { formatFecha } from "@/lib/format";
import { DestinoSelect } from "../nuevo/destino-select";

export default async function PedidosCercanosPage({
  searchParams,
}: {
  searchParams: Promise<NearbyFilters>;
}) {
  const params = await searchParams;
  const hasCenter = Boolean(params.provincia && params.localidad);

  const { center, results, excludedCount, radioKm } = await getOrderNotesNearby(params);

  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();
  const hasAnyFilter = Boolean(params.provincia || params.localidad || params.radio || params.estado_logistica);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Pedidos cercanos
          </h1>
          <p className="text-sm text-btm-black/60">
            Notas de pedido dentro de un radio de una localidad, para planificar camiones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/pedidos/cercanos/export/pdf${qs ? `?${qs}` : ""}`}
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar PDF
          </a>
          <a
            href={`/pedidos/cercanos/export/excel${qs ? `?${qs}` : ""}`}
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar Excel
          </a>
        </div>
      </div>

      <form key={qs} method="get" className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DestinoSelect defaultProvincia={params.provincia} defaultLocalidad={params.localidad} />

          <div className="flex flex-col gap-1">
            <label htmlFor="radio" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Radio (km)
            </label>
            <input
              id="radio"
              type="number"
              name="radio"
              min={1}
              defaultValue={params.radio ?? "100"}
              className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estado_logistica" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Estado pedido
            </label>
            <select
              id="estado_logistica"
              name="estado_logistica"
              defaultValue={params.estado_logistica ?? ""}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ENTREGADO">Entregado</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red"
          >
            Buscar
          </button>
          {hasAnyFilter && (
            <Link
              href="/pedidos/cercanos"
              className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {!hasCenter && (
        <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
          Elegí una provincia y localidad para ver los pedidos cercanos.
        </p>
      )}

      {hasCenter && !center && (
        <p className="rounded-lg border border-btm-red/30 bg-btm-red/5 px-4 py-8 text-center text-btm-red">
          No pudimos ubicar esa localidad. Probá elegirla de nuevo.
        </p>
      )}

      {hasCenter && center && (
        <>
          {excludedCount > 0 && (
            <p className="text-xs text-btm-black/50">
              {excludedCount} nota{excludedCount === 1 ? "" : "s"} sin ubicación cargada, no incluida{excludedCount === 1 ? "" : "s"} en este radio.
            </p>
          )}

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {results.map((order) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 active:bg-black/[.02]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-bold text-btm-navy">{order.numero}</p>
                    <p className="text-xs text-btm-black/50">{formatFecha(order.fecha)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-btm-navy/10 px-2.5 py-1 text-xs font-semibold text-btm-navy">
                      {Math.round(order.distancia_km)} km
                    </span>
                    <LogisticaBadge estado={order.estado_logistica} />
                  </div>
                </div>
                <p className="text-sm font-medium">{order.cliente}</p>
                <p className="text-xs text-btm-black/60">
                  {order.localidad} ({order.provincia})
                  {order.vendedor?.name ? ` · Vend. ${order.vendedor.name}` : ""}
                </p>
                <p className="text-xs text-btm-black/60">
                  {order.items
                    .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                    .join(", ")}
                </p>
              </Link>
            ))}
            {results.length === 0 && (
              <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
                No hay notas de pedido dentro de ese radio.
              </p>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Localidad</th>
                  <th className="px-4 py-3">Distancia</th>
                  <th className="px-4 py-3">Productos</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Producción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {results.map((order) => (
                  <ClickableRow key={order.id} href={`/pedidos/${order.id}`}>
                    <td className="px-4 py-3">
                      <RowLink href={`/pedidos/${order.id}`} className="font-semibold text-btm-navy hover:text-btm-red">
                        {order.numero}
                      </RowLink>
                    </td>
                    <td className="px-4 py-3 text-btm-black/70">{formatFecha(order.fecha)}</td>
                    <td className="px-4 py-3">{order.cliente}</td>
                    <td className="px-4 py-3 text-btm-black/70">
                      {order.localidad} ({order.provincia})
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-btm-navy/10 px-2.5 py-1 text-xs font-semibold text-btm-navy">
                        {Math.round(order.distancia_km)} km
                      </span>
                    </td>
                    <td className="px-4 py-3 text-btm-black/70">
                      {order.items
                        .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-btm-black/70">{order.vendedor?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <LogisticaBadge estado={order.estado_logistica} />
                    </td>
                    <td className="px-4 py-3">
                      <ProduccionBadge estado={order.estado_produccion} />
                    </td>
                  </ClickableRow>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-btm-black/50">
                      No hay notas de pedido dentro de ese radio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {results.length > 0 && (
            <p className="text-xs text-btm-black/50">
              {results.length} nota{results.length === 1 ? "" : "s"} dentro de {radioKm} km.
            </p>
          )}
        </>
      )}
    </div>
  );
}
