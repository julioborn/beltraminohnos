import { createClient } from "@/lib/supabase/server";
import { BrandTexture } from "@/components/brand-texture";
import { PersonalSections } from "./personal-sections";

export default async function PersonalPage() {
  const supabase = await createClient();
  const [{ data: vendedores }, { data: choferes }, { data: camiones }] = await Promise.all([
    supabase.from("vendedores").select("id, name, active").order("name"),
    supabase.from("choferes").select("id, name, active").order("name"),
    supabase.from("camiones").select("id, tipo, marca_modelo, anio, empresa, dominio, chofer_id, active").order("dominio"),
  ]);

  return (
    <div className="relative overflow-hidden">
      <BrandTexture opacity={0.05} />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <PersonalSections vendedores={vendedores ?? []} choferes={choferes ?? []} camiones={camiones ?? []} />
      </div>
    </div>
  );
}
