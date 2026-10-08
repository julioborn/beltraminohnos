import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canViewProduccion } from "@/lib/auth/role";
import { getTurnoDetalle } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";

const PARADA_LABELS: Record<string, string> = {
  ROTURA: "Rotura",
  CORTE_LUZ: "Corte de luz",
  FALTA_MATERIA_PRIMA: "Falta de materia prima",
  OTROS: "Otros",
};

const LIMPIEZA_LABELS: Record<string, string> = { B: "Bueno", R: "Regular", M: "Malo" };
const ENVASE_LABELS: Record<string, string> = { BOLSA: "Bolsa", GRANEL: "Granel", BIG_BAG: "Big bag" };

function hhmm(t: string | null) {
  return t ? t.slice(0, 5) : "—";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="btm-card flex flex-col gap-3 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      {children}
    </section>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</span>
      <span className="text-sm text-btm-black">{value ?? "—"}</span>
    </div>
  );
}

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

      <Section title="Datos del turno">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Item label="Operador" value={turno.operador?.nombre} />
          <Item label="Hora de ingreso" value={hhmm(turno.hora_ingreso)} />
          <Item label="Hora de salida" value={hhmm(turno.hora_salida)} />
        </div>
      </Section>

      <Section title="Empleados afectados al turno">
        {turno.turno_empleados.length === 0 ? (
          <p className="text-sm text-btm-black/50">Sin empleados cargados.</p>
        ) : (
          <div className="flex flex-col divide-y divide-black/5">
            {turno.turno_empleados.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-semibold text-btm-navy">{e.nombre}</span>
                <span className="text-btm-black/60">
                  {hhmm(e.hora_ingreso)} – {hhmm(e.hora_salida)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Paradas durante el turno">
        {turno.turno_paradas.length === 0 ? (
          <p className="text-sm text-btm-black/50">Sin paradas cargadas.</p>
        ) : (
          <div className="flex flex-col divide-y divide-black/5">
            {turno.turno_paradas.map((p) => (
              <div key={p.id} className="flex flex-col gap-0.5 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-btm-navy">{PARADA_LABELS[p.tipo] ?? p.tipo}</span>
                  {p.minutos != null && <span className="text-btm-black/60">{p.minutos} min</span>}
                </div>
                {p.detalle && <span className="text-btm-black/70">{p.detalle}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Estado de planta">
        {!turno.estado_conos_silos && !turno.estado_limpieza && !turno.operador_anterior && !turno.engrase_rolo_hs && !turno.engrase_eje_prensa_hs ? (
          <p className="text-sm text-btm-black/50">Sin estado cargado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Item label="Estado de conos y silos" value={turno.estado_conos_silos === "BIEN" ? "Bien" : turno.estado_conos_silos === "GOLPEADOS" ? "Golpeados" : null} />
            <Item label="Estado de limpieza" value={turno.estado_limpieza ? LIMPIEZA_LABELS[turno.estado_limpieza] : null} />
            <Item label="Operador anterior" value={turno.operador_anterior} />
            <Item label="Engrase rolo" value={hhmm(turno.engrase_rolo_hs)} />
            <Item label="Engrase eje prensa" value={hhmm(turno.engrase_eje_prensa_hs)} />
          </div>
        )}
      </Section>

      <Section title="Observaciones">
        <p className="text-sm text-btm-black/70">{turno.observaciones || "Sin observaciones cargadas."}</p>
      </Section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Productos elaborados en el turno
        </h2>
        {turno.producciones.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            No hay productos cargados en este turno.
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
                {p.formula && <p className="text-xs text-btm-black/50">Set total: {p.formula.set_total_kg} kg</p>}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Item label="Kg. Ciclos" value={p.kg_objetivo} />
                  <Item label="Envase" value={p.tipo_envase ? ENVASE_LABELS[p.tipo_envase] : null} />
                  <Item label="Ciclos completados" value={p.ciclos_completados != null ? `${p.ciclos_completados}/80` : null} />
                  <Item label="Kg producido" value={p.kg_producido_real != null ? p.kg_producido_real.toLocaleString("es-AR") : null} />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Item label="Granel (kg)" value={p.granel_kg} />
                  <Item label="Bolsas (cantidad)" value={p.bolsas_cantidad} />
                  <Item label="Rótulo bolsas" value={p.rotulo_bolsas} />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Item label="Stock granel al cierre" value={p.stock_granel_kg} />
                  <Item label="Stock bolsas al cierre" value={p.stock_bolsas_cantidad} />
                </div>

                {p.produccion_reemplazos.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Reemplazos de materia prima
                    </span>
                    {p.produccion_reemplazos.map((r) => (
                      <div key={r.id} className="flex flex-col gap-0.5 text-sm">
                        <span className="font-semibold text-btm-navy">{r.reemplazo}</span>
                        <span className="text-btm-black/60">
                          {[r.motivo, r.autorizo ? `Autorizó: ${r.autorizo}` : null].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
