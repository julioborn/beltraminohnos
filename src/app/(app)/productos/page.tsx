import { createClient } from "@/lib/supabase/server";
import { BrandTexture } from "@/components/brand-texture";
import { ProductsPricesTable } from "./products-prices-table";

export default async function ProductosPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: zones }, { data: prices }] = await Promise.all([
    supabase.from("products").select("id, name, active").order("name"),
    supabase.from("zones").select("id, code, name").order("sort_order"),
    supabase.from("prices").select("product_id, packaging_type, zone_id, price_usd"),
  ]);

  return (
    <div className="relative overflow-hidden">
      <BrandTexture opacity={0.05} />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <ProductsPricesTable products={products ?? []} zones={zones ?? []} prices={prices ?? []} />
      </div>
    </div>
  );
}
