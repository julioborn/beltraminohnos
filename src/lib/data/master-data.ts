import { createClient } from "@/lib/supabase/server";

export async function getMasterData() {
  const supabase = await createClient();

  const [products, zones, vendedores, choferes, camiones] = await Promise.all([
    supabase.from("products").select("id, name").eq("active", true).order("name"),
    supabase.from("zones").select("id, code, name").order("sort_order"),
    supabase.from("vendedores").select("id, name, profile_id").eq("active", true).order("name"),
    supabase.from("choferes").select("id, name").eq("active", true).order("name"),
    supabase
      .from("camiones")
      .select("id, dominio, tipo, marca_modelo, anio, empresa, chofer_id")
      .eq("active", true)
      .order("dominio"),
  ]);

  return {
    products: products.data ?? [],
    zones: zones.data ?? [],
    vendedores: vendedores.data ?? [],
    choferes: choferes.data ?? [],
    camiones: camiones.data ?? [],
  };
}

export async function getPriceMap() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prices")
    .select("product_id, packaging_type, zone_id, price_usd");

  const map: Record<string, number | null> = {};
  for (const row of data ?? []) {
    map[`${row.product_id}_${row.packaging_type}_${row.zone_id}`] = row.price_usd;
  }
  return map;
}

export async function getClientes() {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("id, name").order("name");
  return data ?? [];
}
