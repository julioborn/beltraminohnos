import Link from "next/link";
import { getRepartos } from "@/lib/data/repartos";
import { formatFecha } from "@/lib/format";

export default async function RepartosPage() {
  const repartos = await getRepartos();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Repartos
          </h1>
          <p className="text-sm text-btm-black/60">Registro de los repartos armados desde Pedidos cercanos.</p>
        </div>
        <Link
          href="/cercanos"
          className="rounded-full bg-btm-navy px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red"
        >
          + Armar reparto
        </Link>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {repartos.map((r) => (
          <Link
            key={r.id}
            href={`/repartos/${r.id}`}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 active:bg-black/[.02]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-sm font-bold text-btm-navy">{r.nombre}</p>
              <p className="text-xs text-btm-black/50">{formatFecha(r.created_at.slice(0, 10))}</p>
            </div>
            <p className="text-xs text-btm-black/60">
              {r.notes.length} nota{r.notes.length === 1 ? "" : "s"} · {r.camiones.length} camión
              {r.camiones.length === 1 ? "" : "es"}
              {r.chofer?.name ? ` · ${r.chofer.name}` : ""}
            </p>
          </Link>
        ))}
        {repartos.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            Todavía no armaste ningún reparto.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Chofer</th>
              <th className="px-4 py-3">Flota</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {repartos.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-black/[.02]">
                <td className="px-4 py-3 font-semibold text-btm-navy">
                  <Link href={`/repartos/${r.id}`} className="hover:text-btm-red">
                    {r.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-btm-black/70">{formatFecha(r.created_at.slice(0, 10))}</td>
                <td className="px-4 py-3 text-btm-black/70">{r.chofer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-btm-black/70">{r.camiones.length}</td>
                <td className="px-4 py-3 text-btm-black/70">{r.notes.length}</td>
              </tr>
            ))}
            {repartos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-btm-black/50">
                  Todavía no armaste ningún reparto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
