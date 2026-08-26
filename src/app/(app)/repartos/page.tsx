import Link from "next/link";
import { getRepartos } from "@/lib/data/repartos";
import { getMasterData } from "@/lib/data/master-data";
import { RepartosList } from "./repartos-list";

export default async function RepartosPage() {
  const [repartos, masterData] = await Promise.all([getRepartos(), getMasterData()]);

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

      <RepartosList repartos={repartos} choferes={masterData.choferes} camiones={masterData.camiones} />
    </div>
  );
}
