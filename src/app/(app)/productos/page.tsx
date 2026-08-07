import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "./products-table";

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, active")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          Productos
        </h1>
        <p className="text-sm text-btm-black/60">
          Catálogo de productos disponibles para las notas de pedido y la lista de precios.
        </p>
      </div>
      <ProductsTable products={products ?? []} />
    </div>
  );
}
