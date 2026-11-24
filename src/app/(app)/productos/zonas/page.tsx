import Link from "next/link";
import { getZones } from "@/lib/data/master-data";
import { NuevaZonaSection } from "./nueva-zona-section";
import { ZonasList } from "./zonas-list";

export default async function ZonasPage() {
  const zones = await getZones();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          href="/productos"
          className="mb-1 flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Productos
        </Link>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">Zonas</h1>
        <p className="text-sm text-btm-black/60">
          Zonas de precio — el código es lo que tiene que coincidir con las columnas del Excel al importar la lista de
          precios.
        </p>
      </div>

      <NuevaZonaSection />

      <ZonasList zonas={zones} />
    </div>
  );
}
