import Link from "next/link";
import { getOrderNotesNearby, type NearbyFilters } from "@/lib/data/nearby";
import { getMasterData } from "@/lib/data/master-data";
import { DestinoSelect } from "../pedidos/nuevo/destino-select";
import { NearbyResults } from "./nearby-results";

export default async function CercanosPage({
  searchParams,
}: {
  searchParams: Promise<NearbyFilters>;
}) {
  const params = await searchParams;
  const hasCenter = Boolean(params.provincia && params.localidad);
  const isTodas = params.todas === "1";

  const [{ center, results, excludedCount, radioKm }, masterData] = await Promise.all([
    getOrderNotesNearby(params),
    getMasterData(),
  ]);

  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v) as [string, string][],
  ).toString();
  const hasAnyFilter = Boolean(params.provincia || params.localidad || params.radio || params.estado_logistica || params.todas);

  const showResults = isTodas || (hasCenter && center);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Pedidos cercanos
          </h1>
          <p className="text-sm text-btm-black/60">
            Notas de pedido dentro de un radio de una localidad, para armar repartos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/cercanos/export/pdf${qs ? `?${qs}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar PDF
          </a>
          <a
            href={`/cercanos/export/excel${qs ? `?${qs}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Exportar Excel
          </a>
        </div>
      </div>

      <form key={qs} method="get" className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DestinoSelect defaultProvincia={params.provincia} defaultLocalidad={params.localidad} />

          <div className="flex flex-col gap-1">
            <label htmlFor="radio" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Radio (km)
            </label>
            <input
              id="radio"
              type="number"
              name="radio"
              min={1}
              defaultValue={params.radio ?? "100"}
              className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estado_logistica" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Estado pedido
            </label>
            <select
              id="estado_logistica"
              name="estado_logistica"
              defaultValue={params.estado_logistica ?? ""}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
              <option value="ENTREGADO">Entregado</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red"
          >
            Buscar
          </button>
          <Link
            href={`/cercanos?todas=1${params.estado_logistica ? `&estado_logistica=${params.estado_logistica}` : ""}`}
            className="flex items-center justify-center rounded-md border border-btm-navy px-4 py-2 text-sm font-semibold text-btm-navy hover:bg-btm-navy/5"
          >
            Ver todas las notas pendientes
          </Link>
          {hasAnyFilter && (
            <Link
              href="/cercanos"
              className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {!hasCenter && !isTodas && (
        <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
          Elegí una provincia y localidad para ver los pedidos cercanos, o mirá todas las notas pendientes.
        </p>
      )}

      {hasCenter && !isTodas && !center && (
        <p className="rounded-lg border border-btm-red/30 bg-btm-red/5 px-4 py-8 text-center text-btm-red">
          No pudimos ubicar esa localidad. Probá elegirla de nuevo.
        </p>
      )}

      {showResults && (
        <>
          {excludedCount > 0 && !isTodas && (
            <p className="text-xs text-btm-black/50">
              {excludedCount} nota{excludedCount === 1 ? "" : "s"} sin ubicación cargada, no incluida{excludedCount === 1 ? "" : "s"} en este radio.
            </p>
          )}

          <NearbyResults results={results} choferes={masterData.choferes} camiones={masterData.camiones} />

          {results.length > 0 && (
            <p className="text-xs text-btm-black/50">
              {results.length} nota{results.length === 1 ? "" : "s"}
              {isTodas ? " pendientes." : ` dentro de ${radioKm} km.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
