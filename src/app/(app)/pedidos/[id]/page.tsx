import Link from "next/link";
import { notFound } from "next/navigation";
import { getMasterData } from "@/lib/data/master-data";
import { getOrderNoteDetail } from "@/lib/data/orders";
import { LogisticaBadge, ProduccionBadge, LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { marcarEntregado, marcarFabricado, updateShippingDetails } from "@/lib/actions/order-notes";
import { formatFecha } from "@/lib/format";
import { ShippingForm } from "./shipping-form";

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
  const pendienteDeEntrega = order.estado_logistica === "PENDIENTE";
  const puedeMarcarFabricado = order.estado_produccion === "PENDIENTE";
  const bloqueadoPorProduccion = pendienteDeEntrega && puedeMarcarFabricado;
  const puedeMarcarEntregado = pendienteDeEntrega && !bloqueadoPorProduccion;
  const marcarEntregadoAction = puedeMarcarEntregado ? marcarEntregado.bind(null, order.id) : null;
  const marcarFabricadoAction = puedeMarcarFabricado ? marcarFabricado.bind(null, order.id) : null;
  const updateShippingAction = updateShippingDetails.bind(null, order.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/pedidos"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Notas de pedido
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-btm-black/50">
              Nota {order.numero} · {formatFecha(order.fecha)}
            </p>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy sm:text-3xl">
              {order.cliente}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <LogisticaBadge estado={order.estado_logistica} />
            <ProduccionBadge estado={order.estado_produccion} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          {(marcarEntregadoAction || marcarFabricadoAction || bloqueadoPorProduccion) && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                {marcarFabricadoAction && (
                  <form action={marcarFabricadoAction} className="flex-1">
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-full bg-btm-navy px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
                    >
                      Marcar como {PRODUCCION_LABELS.FABRICADO}
                    </button>
                  </form>
                )}
                {marcarEntregadoAction ? (
                  <form action={marcarEntregadoAction} className="flex-1">
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-full bg-btm-navy px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
                    >
                      Marcar como {LOGISTICA_LABELS.ENTREGADO}
                    </button>
                  </form>
                ) : (
                  bloqueadoPorProduccion && (
                    <button
                      type="button"
                      disabled
                      title="Marcá primero como Fabricado"
                      className="flex-1 cursor-not-allowed rounded-full bg-btm-black/10 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-black/40"
                    >
                      Marcar como {LOGISTICA_LABELS.ENTREGADO}
                    </button>
                  )
                )}
              </div>
              {bloqueadoPorProduccion && (
                <p className="text-xs text-btm-black/50">Marcá primero como Fabricado para poder entregar la nota.</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={`/pedidos/${order.id}/pdf`}
              className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
            >
              PDF
            </a>
            <a
              href={`/pedidos/${order.id}/excel`}
              className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
            >
              Excel
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Datos del pedido">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              <Field label="Zona" value={order.zona?.name ?? "—"} />
              <Field label="Provincia" value={order.provincia ?? "—"} />
              <Field label="Localidad" value={order.localidad ?? "—"} />
              <Field label="Vendedor" value={order.vendedor?.name ?? "—"} />
            </div>
          </Card>

          <Card title="Productos">
            {/* Mobile: stacked cards, no horizontal scroll needed */}
            <div className="flex flex-col gap-2 sm:hidden">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-black/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.product?.name}</p>
                    <p className="shrink-0 font-semibold text-btm-navy">
                      ${(item.cantidad * item.precio_unitario).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-btm-black/60">
                    {PACKAGING_LABELS[item.tipo_envase as PackagingType]} · {item.cantidad} x ${item.precio_unitario.toFixed(3)}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-lg border border-black/10 sm:block">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5">Envase</th>
                    <th className="px-4 py-2.5">Cantidad</th>
                    <th className="px-4 py-2.5">Precio</th>
                    <th className="px-4 py-2.5">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 font-medium">{item.product?.name}</td>
                      <td className="px-4 py-2.5 text-btm-black/70">
                        {PACKAGING_LABELS[item.tipo_envase as PackagingType]}
                      </td>
                      <td className="px-4 py-2.5 text-btm-black/70">{item.cantidad}</td>
                      <td className="px-4 py-2.5 text-btm-black/70">${item.precio_unitario.toFixed(3)}</td>
                      <td className="px-4 py-2.5 font-semibold text-btm-navy">
                        ${(item.cantidad * item.precio_unitario).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-right font-display text-sm font-bold text-btm-navy">Total: ${total.toFixed(2)}</p>
          </Card>

          <Card title="Detalles de envío">
            <ShippingForm
              action={updateShippingAction}
              choferes={masterData.choferes}
              choferId={order.chofer?.id ?? ""}
              camiones={masterData.camiones}
              camionId={order.camion?.id ?? ""}
              fechaEntrega={order.fecha_entrega ?? ""}
              fechaEnvio={order.fecha_envio ?? ""}
              observaciones={order.observaciones ?? ""}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <div className="hidden lg:block">
            <Card title="Acciones">
              <div className="flex flex-col gap-3">
                {marcarFabricadoAction && (
                  <form action={marcarFabricadoAction}>
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-full bg-btm-navy px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
                    >
                      Marcar como {PRODUCCION_LABELS.FABRICADO}
                    </button>
                  </form>
                )}
                {marcarEntregadoAction ? (
                  <form action={marcarEntregadoAction}>
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-full bg-btm-navy px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
                    >
                      Marcar como {LOGISTICA_LABELS.ENTREGADO}
                    </button>
                  </form>
                ) : (
                  bloqueadoPorProduccion && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled
                        title="Marcá primero como Fabricado"
                        className="w-full cursor-not-allowed rounded-full bg-btm-black/10 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-black/40"
                      >
                        Marcar como {LOGISTICA_LABELS.ENTREGADO}
                      </button>
                      <p className="text-xs text-btm-black/50">Marcá primero como Fabricado para poder entregar la nota.</p>
                    </div>
                  )
                )}
                <div className="flex gap-2">
                  <a
                    href={`/pedidos/${order.id}/pdf`}
                    className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                  >
                    PDF
                  </a>
                  <a
                    href={`/pedidos/${order.id}/excel`}
                    className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                  >
                    Excel
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Historial">
            <ol className="flex flex-col gap-3 border-l-2 border-black/10 pl-4">
              {(history ?? []).map((h) => (
                <li key={h.id} className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/40">
                    {h.campo === "PRODUCCION" ? "Producción" : "Pedido"}
                  </span>
                  {h.campo === "PRODUCCION" ? (
                    <ProduccionBadge estado={h.estado as "PENDIENTE" | "FABRICADO"} />
                  ) : (
                    <LogisticaBadge estado={h.estado as "PENDIENTE" | "ENTREGADO"} />
                  )}
                  <span className="text-xs text-btm-black/50">
                    {new Date(h.changed_at).toLocaleString("es-AR")}
                  </span>
                </li>
              ))}
              {(!history || history.length === 0) && (
                <li className="text-sm text-btm-black/50">Sin cambios registrados.</li>
              )}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
