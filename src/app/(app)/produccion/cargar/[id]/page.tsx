import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/role";
import { getTurnoDetalle, getFormulas } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";
import { TurnoDatosView, TurnoRestoView, ProduccionDetalleCard } from "../../turno-detalle-view";
import { EditarCiclosForm } from "../editar-ciclos-form";
import { AgregarProductoForm } from "../agregar-producto-form";
import { FinalizarTurnoButton } from "../finalizar-turno-button";

export default async function ContinuarTurnoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/inicio");

  const { id } = await params;
  const [turno, formulas] = await Promise.all([getTurnoDetalle(id), getFormulas()]);
  if (!turno) notFound();

  const hoy = new Date().toISOString().slice(0, 10);
  const esHoy = turno.fecha === hoy;
  const editable = esHoy && !turno.finalizado;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/produccion/cargar"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Producción diaria
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
              {turno.numero}
            </h1>
            {turno.finalizado && (
              <span className="rounded-full bg-btm-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-btm-navy">
                Finalizado
              </span>
            )}
          </div>
          <span className="text-sm text-btm-black/60">{formatFecha(turno.fecha)} · {turno.operador?.nombre ?? "—"}</span>
        </div>
      </div>

      {turno.finalizado ? (
        <p className="rounded-lg border border-btm-navy/30 bg-btm-navy/5 px-4 py-3 text-sm text-btm-navy">
          Este turno fue finalizado — quedó guardado y no se puede seguir editando.
        </p>
      ) : (
        !esHoy && (
          <p className="rounded-lg border border-btm-red/30 bg-btm-red/5 px-4 py-3 text-sm text-btm-red">
            Este turno ya no es de hoy, quedó cerrado — no se puede seguir cargando.
          </p>
        )
      )}

      <TurnoDatosView turno={turno} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Productos de este turno
        </h2>
        {turno.producciones.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            Todavía no hay productos cargados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {turno.producciones.map((p) => (
              <ProduccionDetalleCard
                key={p.id}
                p={p}
                ciclosSlot={
                  editable ? (
                    <EditarCiclosForm produccionId={p.id} ciclosIniciales={p.ciclos_completados ?? 0} />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <TurnoRestoView turno={turno} />

      {editable && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
            Agregar otro producto a este turno
          </h2>
          <AgregarProductoForm turnoId={turno.id} formulas={formulas} />
        </section>
      )}

      {editable && (
        <div className="border-t border-black/10 pt-4">
          <FinalizarTurnoButton turnoId={turno.id} />
        </div>
      )}
    </div>
  );
}
