import { createClient } from "@/lib/supabase/server";

export type ProductStockBalance = { productId: string; cantidad: number };

// El saldo de stock precargado no se guarda como un campo mutable: se suma
// al leer, igual que el saldo de consignaciones y el consumo de materia
// prima — así cada carga manual y cada descuento por entrega (insertado por
// el trigger de order_items) quedan como un movimiento auditable en vez de
// pisar un número.
export async function getProductStockBalances(): Promise<ProductStockBalance[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_stock_movements").select("product_id, cantidad");

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.product_id, (totals.get(row.product_id) ?? 0) + row.cantidad);
  }

  return Array.from(totals.entries()).map(([productId, cantidad]) => ({ productId, cantidad }));
}
