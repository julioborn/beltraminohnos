import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/role";
import { getFormulas, getOperadoresFabrica, getTurnosRecientesDeCuenta } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";
import { TurnoForm } from "./turno-form";

export default async function CargarProduccionPage() {
  const user = await getAuthUser();
  if (!user) redirect("/inicio");

  const [formulas, operadores, turnosRecientes] = await Promise.all([
    getFormulas(),
    getOperadoresFabrica(),
    getTurnosRecientesDeCuenta(user.id),
  ]);

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-28 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Producción diaria
        </h1>
        <p className="text-sm text-btm-black/60">Cargá los datos del turno y los productos elaborados.</p>
      </div>

      <TurnoForm formulas={formulas} operadores={operadores} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Últimos turnos cargados
        </h2>
        {turnosRecientes.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            Todavía no se cargó ningún turno.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
            {turnosRecientes.map((t) => (
              <div key={t.id} className="flex flex-col gap-1 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-btm-navy">{t.numero}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-btm-black/50">{formatFecha(t.fecha)}</span>
                    <Link
                      href={`/produccion/cargar/${t.id}`}
                      className="text-xs font-semibold uppercase tracking-wide text-btm-navy hover:underline"
                    >
                      {t.fecha === hoy ? "Continuar cargando →" : "Ver detalle →"}
                    </Link>
                  </div>
                </div>
                <span className="text-btm-black/70">
                  {t.operador?.nombre ?? "—"} · {t.producciones.length} producto{t.producciones.length === 1 ? "" : "s"} ·{" "}
                  {t.producciones.map((p) => p.formula?.nombre).filter(Boolean).join(", ") || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
