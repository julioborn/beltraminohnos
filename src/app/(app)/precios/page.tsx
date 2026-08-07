import { createClient } from "@/lib/supabase/server";
import { PricesGrid } from "./prices-grid";

export default async function PreciosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: zones }, { data: prices }] = await Promise.all([
    supabase.from("products").select("id, name").eq("active", true).order("name"),
    supabase.from("zones").select("id, code, name").order("name"),
    supabase.from("prices").select("product_id, packaging_type, zone_id, price_usd"),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Lista de precios
        </h1>
        <p className="text-sm text-btm-black/60">Precios en USD por kg. Los cambios se guardan automáticamente.</p>
      </div>
      <PricesGrid products={products ?? []} zones={zones ?? []} prices={prices ?? []} />
    </div>
  );
}
