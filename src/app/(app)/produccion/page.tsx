import Link from "next/link";
import { redirect } from "next/navigation";
import { canViewProduccion } from "@/lib/auth/role";
import { getTurnos, getConsumoMateriaPrima, type ProduccionFilters } from "@/lib/data/produccion";
import { formatFecha } from "@/lib/format";
import { ScrollFade } from "@/components/scroll-fade";

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<ProduccionFilters>;
}) {
  if (!(await canViewProduccion())) {
    redirect("/inicio");
  }

  const params = await searchParams;
  const rangeFilters = { desde: params.desde, hasta: params.hasta };

  const [turnos, consumo] = await Promise.all([getTurnos(params), getConsumoMateriaPrima(rangeFilters)]);

  const hasFilter = Boolean(params.desde || params.hasta);
  const totalInsumos = consumo.insumos.reduce((sum, i) => sum + i.kgConsumidos, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Producción de fábrica
          </h1>
          <p className="text-sm text-btm-black/60">Turnos de planta y consumo de materia prima calculado.</p>
        </div>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Desde
          </label>
          <input id="desde" type="date" name="desde" defaultValue={params.desde} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Hasta
          </label>
          <input id="hasta" type="date" name="hasta" defaultValue={params.hasta} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red">
            Filtrar
          </button>
          {hasFilter && (
            <Link
              href="/produccion"
              className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
            Consumo de materia prima {hasFilter && "(en el período)"}
          </h2>
          <span className="text-xs font-semibold text-btm-black/60">
            Total producido: {totalInsumos.toLocaleString("es-AR", { maximumFractionDigits: 1 })} kg
          </span>
        </div>
        {consumo.insumos.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            No hay producción cargada todavía.
          </p>
        ) : (
          <ScrollFade>
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                  <tr>
                    <th className="px-4 py-2.5">Insumo</th>
                    <th className="px-4 py-2.5 text-right">Kg consumidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {consumo.insumos.map((i) => (
                    <tr key={i.producto}>
                      <td className="px-4 py-2.5">{i.producto}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-btm-navy">
                        {i.kgConsumidos.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollFade>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Turnos</h2>
        {turnos.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            No hay turnos cargados todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {turnos.map((t) => (
              <div key={t.id} className="btm-card flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-bold text-btm-navy">{t.numero}</span>
                    {t.finalizado && (
                      <span className="rounded-full bg-btm-navy/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-btm-navy">
                        Finalizado
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-btm-black/50">{formatFecha(t.fecha)}</span>
                    <Link
                      href={`/produccion/${t.id}`}
                      className="text-xs font-semibold uppercase tracking-wide text-btm-navy hover:underline"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-btm-black/70">
                  <span>Operador: {t.operador?.nombre ?? "—"}</span>
                  {t.hora_ingreso && <span>· Ingreso {t.hora_ingreso.slice(0, 5)}</span>}
                  {t.hora_salida && <span>· Salida {t.hora_salida.slice(0, 5)}</span>}
                </div>
                <ScrollFade>
                  <div className="overflow-x-auto rounded-md border border-black/10">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="bg-black/[.03] text-left font-semibold uppercase tracking-wide text-btm-black/60">
                        <tr>
                          <th className="px-3 py-2">Fórmula</th>
                          <th className="px-3 py-2 text-right">Kg objetivo</th>
                          <th className="px-3 py-2 text-right">Kg real</th>
                          <th className="px-3 py-2">Envase</th>
                          <th className="px-3 py-2">Partida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {t.producciones.map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2">
                              {p.formula ? `${p.formula.codigo} · ${p.formula.nombre}` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right">{p.kg_objetivo ?? "—"}</td>
                            <td className="px-3 py-2 text-right font-semibold text-btm-navy">
                              {p.kg_producido_real ?? "—"}
                            </td>
                            <td className="px-3 py-2">{p.tipo_envase ?? "—"}</td>
                            <td className="px-3 py-2">{p.partida ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollFade>
                {t.turno_paradas.length > 0 && (
                  <p className="text-xs text-btm-black/60">
                    Paradas: {t.turno_paradas.map((pa) => `${pa.tipo}${pa.minutos ? ` (${pa.minutos}m)` : ""}`).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
