import { createClient } from "@/lib/supabase/server";
import { PersonTable } from "./person-table";
import {
  createVendedor,
  renameVendedor,
  setVendedorActive,
  deleteVendedor,
  createChofer,
  renameChofer,
  setChoferActive,
  deleteChofer,
} from "@/lib/actions/personal";

export default async function PersonalPage() {
  const supabase = await createClient();
  const [{ data: vendedores }, { data: choferes }] = await Promise.all([
    supabase.from("vendedores").select("id, name, active").order("name"),
    supabase.from("choferes").select("id, name, active").order("name"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Personal
        </h1>
        <p className="text-sm text-btm-black/60">
          Vendedores y choferes disponibles para las notas de pedido. Los inactivos dejan de aparecer como opción al cargar una nota nueva, pero se conservan en las notas existentes.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-black">Vendedores</h2>
        <PersonTable
          people={vendedores ?? []}
          placeholder="Ej: JUAN PABLO"
          emptyLabel="No hay vendedores cargados."
          createAction={createVendedor}
          renameAction={renameVendedor}
          setActiveAction={setVendedorActive}
          deleteAction={deleteVendedor}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-black">Choferes</h2>
        <PersonTable
          people={choferes ?? []}
          placeholder="Ej: BRITEZ"
          emptyLabel="No hay choferes cargados."
          createAction={createChofer}
          renameAction={renameChofer}
          setActiveAction={setChoferActive}
          deleteAction={deleteChofer}
        />
      </section>
    </div>
  );
}
