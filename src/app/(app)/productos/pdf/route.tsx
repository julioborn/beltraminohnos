import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ProductsDocument } from "@/lib/pdf/products-document";

export async function GET() {
  const supabase = await createClient();
  const [{ data: products }, { data: zones }, { data: prices }] = await Promise.all([
    supabase.from("products").select("id, name, active").order("name"),
    supabase.from("zones").select("id, name").order("sort_order"),
    supabase.from("prices").select("product_id, packaging_type, zone_id, price_usd"),
  ]);

  const buffer = await renderToBuffer(
    <ProductsDocument products={products ?? []} zones={zones ?? []} prices={prices ?? []} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="productos-precios.pdf"`,
    },
  });
}
