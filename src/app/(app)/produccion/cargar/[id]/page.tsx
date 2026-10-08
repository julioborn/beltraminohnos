import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/role";
import { getTurnoDetalle, getFormulas } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";
import { EditarCiclosForm } from "../editar-ciclos-form";
import { AgregarProductoForm } from "../agregar-producto-form";

export default async function ContinuarTurnoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect("/inicio");

  const { id } = await params;
  const [turno, formulas] = await Promise.all([getTurnoDetalle(id), getFormulas()]);
  if (!turno) notFound();

  const hoy = new Date().toISOString().slice(0, 10);
  const esHoy = turno.fecha === hoy;

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
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            {turno.numero}
          </h1>
          <span className="text-sm text-btm-black/60">{formatFecha(turno.fecha)} · {turno.operador?.nombre ?? "—"}</span>
        </div>
      </div>

      {!esHoy && (
        <p className="rounded-lg border border-btm-red/30 bg-btm-red/5 px-4 py-3 text-sm text-btm-red">
          Este turno ya no es de hoy, quedó cerrado — no se puede seguir cargando.
        </p>
      )}

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
              <div key={p.id} className="btm-card flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-btm-navy">
                    {p.formula ? `${p.formula.codigo} · ${p.formula.nombre}` : "—"}
                  </span>
                  <span className="text-xs text-btm-black/50">{p.numero}</span>
                </div>
                {esHoy ? (
                  <EditarCiclosForm produccionId={p.id} ciclosIniciales={p.ciclos_completados ?? 0} />
                ) : (
                  <p className="text-sm text-btm-black/70">
                    Ciclos completados: {p.ciclos_completados ?? 0}/80 ·{" "}
                    {((p.ciclos_completados ?? 0) * 1000).toLocaleString("es-AR")} kg
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {esHoy && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
            Agregar otro producto a este turno
          </h2>
          <AgregarProductoForm turnoId={turno.id} formulas={formulas} />
        </section>
      )}
    </div>
  );
}
