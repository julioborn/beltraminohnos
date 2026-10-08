import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canViewProduccion } from "@/lib/auth/role";
import { getTurnoDetalle } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";
import { TurnoDatosView, TurnoRestoView, ProduccionDetalleCard } from "../turno-detalle-view";
import { EliminarTurnoButton } from "../eliminar-turno-button";

export default async function TurnoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await canViewProduccion())) {
    redirect("/inicio");
  }

  const { id } = await params;
  const turno = await getTurnoDetalle(id);
  if (!turno) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/produccion"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Producción
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            {turno.numero}
          </h1>
          <span className="text-sm text-btm-black/60">{formatFecha(turno.fecha)}</span>
        </div>
      </div>

      <TurnoDatosView turno={turno} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Productos de este turno
        </h2>
        {turno.producciones.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            No hay productos cargados en este turno.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {turno.producciones.map((p) => (
              <ProduccionDetalleCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <TurnoRestoView turno={turno} />

      <div className="border-t border-black/10 pt-4">
        <EliminarTurnoButton turnoId={turno.id} />
      </div>
    </div>
  );
}
