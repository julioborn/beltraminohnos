import Link from "next/link";
import { getAuthUser } from "@/lib/auth/role";
import { getMyOrderNotes } from "@/lib/data/orders";
import { getSucursalByProfileId } from "@/lib/data/consignaciones";
import { LogisticaBadge, ProduccionBadge } from "@/components/estado-badge";
import { formatFecha } from "@/lib/format";

export default async function MisNotasPage() {
  const user = await getAuthUser();

  const [notes, misucursal] = await Promise.all([
    user ? getMyOrderNotes(user.id) : Promise.resolve([]),
    user ? getSucursalByProfileId(user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/pedidos/nuevo"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-btm-navy px-6 py-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_-4px_rgba(20,29,58,0.35)] hover:bg-btm-red"
        >
          + Nueva nota de pedido
        </Link>
        {misucursal && (
          <Link
            href="/consignaciones/mi-sucursal"
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-btm-navy px-6 py-4 font-display text-sm font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Consignaciones
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy/70">
          Mis notas de pedido
        </h2>

        {notes.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            Todavía no cargaste ninguna nota.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
            {notes.map((n) => (
              <div key={n.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-btm-navy">{n.numero}</span>
                  <span className="text-xs text-btm-black/50">{formatFecha(n.fecha)}</span>
                </div>
                <p className="text-sm text-btm-black/80">{n.cliente}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <ProduccionBadge estado={n.estado_produccion} />
                    <LogisticaBadge estado={n.estado_logistica} />
                  </div>
                  <a
                    href={`/mis-notas/${n.id}/pdf`}
                    className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                  >
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
