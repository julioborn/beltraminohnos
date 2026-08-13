import { createClient } from "@/lib/supabase/server";
import { buildProductsWorkbook } from "@/lib/excel/products-excel";

export async function GET() {
  const supabase = await createClient();
  const [{ data: products }, { data: zones }, { data: prices }] = await Promise.all([
    supabase.from("products").select("id, name, active").order("name"),
    supabase.from("zones").select("id, name").order("sort_order"),
    supabase.from("prices").select("product_id, packaging_type, zone_id, price_usd"),
  ]);

  const workbook = await buildProductsWorkbook(products ?? [], zones ?? [], prices ?? []);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="productos-precios.xlsx"`,
    },
  });
}
