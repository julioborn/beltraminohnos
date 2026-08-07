import { notFound } from "next/navigation";
import { getMasterData } from "@/lib/data/master-data";
import { getOrderNoteDetail } from "@/lib/data/orders";
import { EstadoBadge, ESTADO_ORDER, ESTADO_LABELS } from "@/components/estado-badge";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { advanceOrderStatus, updateShippingDetails } from "@/lib/actions/order-notes";

export default async function NotaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, masterData] = await Promise.all([getOrderNoteDetail(id), getMasterData()]);

  if (!detail) notFound();
  const { order, history } = detail;

  const total = order.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
  const currentIndex = ESTADO_ORDER.indexOf(order.estado);
  const nextEstado = ESTADO_ORDER[currentIndex + 1];
  const advanceAction = nextEstado ? advanceOrderStatus.bind(null, order.id, order.estado) : null;
  const updateShippingAction = updateShippingDetails.bind(null, order.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-btm-black/50">Nota</p>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            {order.numero}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <a
              href={`/pedidos/${order.id}/pdf`}
              className="rounded-full border border-btm-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
            >
              PDF
            </a>
            <a
              href={`/pedidos/${order.id}/excel`}
              className="rounded-full border border-btm-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
            >
              Excel
            </a>
          </div>
          <EstadoBadge estado={order.estado} />
          {advanceAction && (
            <form action={advanceAction}>
              <button
                type="submit"
                className="rounded-full bg-btm-navy px-5 py-2 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
              >
                Marcar como {ESTADO_LABELS[nextEstado]}
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-4 text-sm sm:grid-cols-3">
        <Field label="Cliente" value={order.cliente} />
        <Field label="Zona" value={order.zona?.name ?? "—"} />
        <Field label="Provincia" value={order.provincia ?? "—"} />
        <Field label="Localidad" value={order.localidad ?? "—"} />
        <Field label="Fecha" value={order.fecha} />
        <Field label="Día de entrega" value={order.dia_entrega ?? "—"} />
        <Field label="Vendedor" value={order.vendedor?.name ?? "—"} />
        <Field label="Chofer" value={order.chofer?.name ?? "—"} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Productos</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-black/5 text-left text-xs font-semibold uppercase tracking-wide text-btm-black/60">
              <tr>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Envase</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Precio</th>
                <th className="px-4 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.product?.name}</td>
                  <td className="px-4 py-2 text-btm-black/70">{PACKAGING_LABELS[item.tipo_envase as PackagingType]}</td>
                  <td className="px-4 py-2 text-btm-black/70">{item.cantidad}</td>
                  <td className="px-4 py-2 text-btm-black/70">${item.precio_unitario.toFixed(3)}</td>
                  <td className="px-4 py-2 font-semibold">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-right font-display text-sm font-bold text-btm-navy">Total: ${total.toFixed(2)}</p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Detalles de envío
        </h2>
        <form action={updateShippingAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Chofer</label>
            <select
              name="chofer_id"
              defaultValue={order.chofer?.id ?? ""}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {masterData.choferes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Día de entrega</label>
            <input
              name="dia_entrega"
              defaultValue={order.dia_entrega ?? ""}
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Fecha de envío</label>
            <input
              type="date"
              name="fecha_envio"
              defaultValue={order.fecha_envio ?? ""}
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Observaciones</label>
            <textarea
              name="observaciones"
              rows={2}
              defaultValue={order.observaciones ?? ""}
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full border border-btm-navy px-5 py-2 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:col-span-2"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Historial</h2>
        <ol className="flex flex-col gap-2 border-l-2 border-black/10 pl-4">
          {(history ?? []).map((h) => (
            <li key={h.id} className="text-sm">
              <EstadoBadge estado={h.estado} />{" "}
              <span className="text-btm-black/50">
                {new Date(h.changed_at).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</p>
      <p>{value}</p>
    </div>
  );
}
