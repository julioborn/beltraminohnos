import Link from "next/link";
import { getMasterData } from "@/lib/data/master-data";
import { getOrderNotesList, type OrderListFilters } from "@/lib/data/orders";
import { LogisticaBadge, ProduccionBadge } from "@/components/estado-badge";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";

type SearchParams = OrderListFilters;

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [orders, masterData] = await Promise.all([getOrderNotesList(params), getMasterData()]);
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();

  const advancedKeys = ["estado_logistica", "estado_produccion", "zona", "producto", "vendedor", "chofer", "desde", "hasta"] as const;
  const advancedFilterCount = advancedKeys.filter((key) => params[key]).length;
  const hasAdvancedFilter = advancedFilterCount > 0;
  const hasAnyFilter = hasAdvancedFilter || Boolean(params.q);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Notas de pedido
        </h1>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/pedidos/export/pdf${qs ? `?${qs}` : ""}`}
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar PDF
          </a>
          <a
            href={`/pedidos/export/excel${qs ? `?${qs}` : ""}`}
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar Excel
          </a>
          <Link
            href="/pedidos/nuevo"
            className="rounded-full bg-btm-navy px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red"
          >
            + Nueva nota
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
              Buscar
            </label>
            <input
              id="q"
              type="text"
              name="q"
              placeholder="Cliente, N°, provincia o localidad..."
              defaultValue={params.q}
              className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red"
            >
              Filtrar
            </button>
            {hasAnyFilter && (
              <Link
                href="/pedidos"
                className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
              >
                Limpiar
              </Link>
            )}
          </div>
        </div>

        <details className="group" open={hasAdvancedFilter}>
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy [&::-webkit-details-marker]:hidden">
            <svg
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4l6 6-6 6V4z" />
            </svg>
            Más filtros
            {advancedFilterCount > 0 && (
              <span className="rounded-full bg-btm-navy px-2 py-0.5 text-[10px] font-bold text-white">
                {advancedFilterCount}
              </span>
            )}
          </summary>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="estado_logistica" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Estado pedido
              </label>
              <select id="estado_logistica" name="estado_logistica" defaultValue={params.estado_logistica ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="estado_produccion" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Estado producción
              </label>
              <select id="estado_produccion" name="estado_produccion" defaultValue={params.estado_produccion ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="FABRICADO">Fabricado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="zona" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Zona
              </label>
              <select id="zona" name="zona" defaultValue={params.zona ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todas</option>
                {masterData.zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="producto" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Producto
              </label>
              <select id="producto" name="producto" defaultValue={params.producto ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                {masterData.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="vendedor" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Vendedor
              </label>
              <select id="vendedor" name="vendedor" defaultValue={params.vendedor ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                {masterData.vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="chofer" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Chofer
              </label>
              <select id="chofer" name="chofer" defaultValue={params.chofer ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
                <option value="">Todos</option>
                {masterData.choferes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="desde" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Desde
              </label>
              <input id="desde" type="date" name="desde" defaultValue={params.desde} className="rounded-md border border-black/15 px-2 py-2 text-sm" />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="hasta" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Hasta
              </label>
              <input id="hasta" type="date" name="hasta" defaultValue={params.hasta} className="rounded-md border border-black/15 px-2 py-2 text-sm" />
            </div>
          </div>
        </details>
      </form>

      {/* Mobile: cards, so Estado stays visible without horizontal scroll */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/pedidos/${order.id}`}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 active:bg-black/[.02]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-bold text-btm-navy">{order.numero}</p>
                <p className="text-xs text-btm-black/50">{order.fecha}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <LogisticaBadge estado={order.estado_logistica} />
                <ProduccionBadge estado={order.estado_produccion} />
              </div>
            </div>
            <p className="text-sm font-medium">{order.cliente}</p>
            <p className="text-xs text-btm-black/60">
              {order.zona?.name ?? "—"}
              {order.vendedor?.name ? ` · Vend. ${order.vendedor.name}` : ""}
              {order.chofer?.name ? ` · Chofer ${order.chofer.name}` : ""}
            </p>
            <p className="text-xs text-btm-black/60">
              {order.items
                .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                .join(", ")}
            </p>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            No hay notas de pedido con estos filtros.
          </p>
        )}
      </div>

      {/* Desktop: full table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Zona</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Chofer</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Producción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-black/[.02]">
                <td className="px-4 py-3">
                  <Link href={`/pedidos/${order.id}`} className="font-semibold text-btm-navy hover:text-btm-red">
                    {order.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-btm-black/70">{order.fecha}</td>
                <td className="px-4 py-3">{order.cliente}</td>
                <td className="px-4 py-3 text-btm-black/70">{order.zona?.name ?? "—"}</td>
                <td className="px-4 py-3 text-btm-black/70">
                  {order.items
                    .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                    .join(", ")}
                </td>
                <td className="px-4 py-3 text-btm-black/70">{order.vendedor?.name ?? "—"}</td>
                <td className="px-4 py-3 text-btm-black/70">{order.chofer?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <LogisticaBadge estado={order.estado_logistica} />
                </td>
                <td className="px-4 py-3">
                  <ProduccionBadge estado={order.estado_produccion} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-btm-black/50">
                  No hay notas de pedido con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
