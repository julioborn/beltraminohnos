"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CargarStockState = { error: string } | { success: true } | undefined;

export async function cargarStock(_prevState: CargarStockState, formData: FormData): Promise<CargarStockState> {
  const productId = String(formData.get("product_id") ?? "");
  const cantidad = Number(formData.get("cantidad") ?? 0);
  const nota = String(formData.get("nota") ?? "").trim() || null;

  if (!productId) {
    return { error: "Seleccioná un producto." };
  }
  if (!cantidad || cantidad <= 0) {
    return { error: "Ingresá una cantidad mayor a cero." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("product_stock_movements").insert({
    product_id: productId,
    tipo: "CARGA",
    cantidad,
    nota,
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: `No se pudo cargar el stock: ${error.message}` };
  }

  revalidatePath("/productos/pendientes");
  return { success: true };
}
