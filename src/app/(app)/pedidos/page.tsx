import Link from "next/link";
import { getMasterData } from "@/lib/data/master-data";
import { getOrderNotesList, type OrderListFilters } from "@/lib/data/orders";
import { EstadoBadge } from "@/components/estado-badge";
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

      <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <input
          type="text"
          name="q"
          placeholder="Buscar cliente o N°..."
          defaultValue={params.q}
          className="col-span-2 rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
        />
        <select name="estado" defaultValue={params.estado ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
          <option value="">Estado</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="FABRICADO">Fabricado</option>
          <option value="ENTREGADO">Entregado</option>
        </select>
        <select name="zona" defaultValue={params.zona ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
          <option value="">Zona</option>
          {masterData.zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <select name="vendedor" defaultValue={params.vendedor ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
          <option value="">Vendedor</option>
          {masterData.vendedores.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <select name="chofer" defaultValue={params.chofer ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
          <option value="">Chofer</option>
          {masterData.choferes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="producto" defaultValue={params.producto ?? ""} className="rounded-md border border-black/15 bg-white px-2 py-2 text-sm">
          <option value="">Producto</option>
          {masterData.products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input type="date" name="desde" defaultValue={params.desde} className="rounded-md border border-black/15 px-2 py-2 text-sm" />
        <input type="date" name="hasta" defaultValue={params.hasta} className="rounded-md border border-black/15 px-2 py-2 text-sm" />
        <button
          type="submit"
          className="rounded-md bg-btm-black px-4 py-2 text-sm font-semibold text-white hover:bg-btm-navy"
        >
          Filtrar
        </button>
        <Link
          href="/pedidos"
          className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
        >
          Limpiar
        </Link>
      </form>

      <div className="overflow-x-auto rounded-lg border border-black/10">
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
              <th className="px-4 py-3">Estado</th>
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
                  <EstadoBadge estado={order.estado} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-btm-black/50">
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
