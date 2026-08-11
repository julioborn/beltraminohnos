import { createClient } from "@/lib/supabase/server";
import { PersonalSections } from "./personal-sections";

export default async function PersonalPage() {
  const supabase = await createClient();
  const [{ data: vendedores }, { data: choferes }, { data: camiones }] = await Promise.all([
    supabase.from("vendedores").select("id, name, active").order("name"),
    supabase.from("choferes").select("id, name, active").order("name"),
    supabase.from("camiones").select("id, tipo, marca_modelo, anio, empresa, dominio, chofer_id, active").order("dominio"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Personal
        </h1>
        <p className="text-sm text-btm-black/60">
          Vendedores, choferes y flota disponibles para las notas de pedido. Tocá una tarjeta para ver y editar esa sección.
        </p>
      </div>

      <PersonalSections vendedores={vendedores ?? []} choferes={choferes ?? []} camiones={camiones ?? []} />
    </div>
  );
}
