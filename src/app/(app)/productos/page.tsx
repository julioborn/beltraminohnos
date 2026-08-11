import { createClient } from "@/lib/supabase/server";
import { ProductsPricesTable } from "./products-prices-table";

export default async function ProductosPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: zones }, { data: prices }] = await Promise.all([
    supabase.from("products").select("id, name, active").order("name"),
    supabase.from("zones").select("id, code, name").order("sort_order"),
    supabase.from("prices").select("product_id, packaging_type, zone_id, price_usd"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Productos y precios
        </h1>
        <p className="text-sm text-btm-black/60">
          Catálogo de productos y su lista de precios en USD por kg, según envase y zona.
        </p>
      </div>
      <ProductsPricesTable products={products ?? []} zones={zones ?? []} prices={prices ?? []} />
    </div>
  );
}
