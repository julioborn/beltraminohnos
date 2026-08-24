import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepartoDetail } from "@/lib/data/repartos";
import { deleteReparto } from "@/lib/actions/repartos";
import { LogisticaBadge } from "@/components/estado-badge";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { formatFecha } from "@/lib/format";
import { DeleteRepartoButton } from "./delete-reparto-button";

export default async function RepartoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getRepartoDetail(id);
  if (!detail) notFound();

  const { reparto, notes } = detail;
  const deleteAction = deleteReparto.bind(null, reparto.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/repartos"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Repartos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-btm-black/50">
              {formatFecha(reparto.created_at.slice(0, 10))} · {notes.length} nota{notes.length === 1 ? "" : "s"}
            </p>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy sm:text-3xl">
              {reparto.nombre}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`/repartos/${reparto.id}/export/pdf`}
            className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:flex-none"
          >
            Exportar PDF
          </a>
          <a
            href={`/repartos/${reparto.id}/export/excel`}
            className="flex-1 rounded-full border border-btm-navy px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:flex-none"
          >
            Exportar Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Datos del reparto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              <Field label="Chofer" value={reparto.chofer?.name ?? "—"} />
              <Field
                label="Flota"
                value={reparto.camiones.length > 0 ? reparto.camiones.map((c) => c.camion?.dominio).join(", ") : "—"}
              />
              <Field label="Notas" value={String(notes.length)} />
            </div>
            {reparto.descripcion && (
              <div className="mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">Descripción</p>
                <p className="text-sm">{reparto.descripcion}</p>
              </div>
            )}
          </Card>

          <Card title="Notas incluidas">
            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-2 sm:hidden">
              {notes.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-black/10 p-3 active:bg-black/[.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-btm-navy">{order.numero}</p>
                    <LogisticaBadge estado={order.estado_logistica} />
                  </div>
                  <p className="text-sm font-medium">{order.cliente}</p>
                  <p className="text-xs text-btm-black/60">
                    {order.localidad ? `${order.localidad} (${order.provincia})` : "—"}
                  </p>
                  <p className="text-xs text-btm-black/60">
                    {order.items
                      .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                      .join(", ")}
                  </p>
                </Link>
              ))}
              {notes.length === 0 && (
                <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
                  Este reparto no tiene notas.
                </p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-lg border border-black/10 sm:block">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-4 py-2.5">N°</th>
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Localidad</th>
                    <th className="px-4 py-2.5">Productos</th>
                    <th className="px-4 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {notes.map((order) => (
                    <tr key={order.id} className="cursor-pointer hover:bg-black/[.02]">
                      <td className="px-4 py-2.5 font-semibold text-btm-navy">
                        <Link href={`/pedidos/${order.id}`} className="hover:text-btm-red">
                          {order.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{order.cliente}</td>
                      <td className="px-4 py-2.5 text-btm-black/70">
                        {order.localidad ? `${order.localidad} (${order.provincia})` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-btm-black/70">
                        {order.items
                          .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                          .join(", ")}
                      </td>
                      <td className="px-4 py-2.5">
                        <LogisticaBadge estado={order.estado_logistica} />
                      </td>
                    </tr>
                  ))}
                  {notes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-btm-black/50">
                        Este reparto no tiene notas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <Card title="Acciones">
            <DeleteRepartoButton nombre={reparto.nombre} deleteAction={deleteAction} />
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
