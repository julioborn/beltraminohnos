"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateProductState = { error: string } | undefined;

export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const name = String(formData.get("name") ?? "").trim().toUpperCase();

  if (!name) {
    return { error: "Ingresá el nombre del producto." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({ name });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un producto con ese nombre." : `No se pudo crear: ${error.message}`,
    };
  }

  revalidatePath("/productos");
  return undefined;
}

export async function renameProduct(productId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ name: name.trim().toUpperCase() })
    .eq("id", productId);

  revalidatePath("/productos");
  return { error: error?.message };
}

export async function setProductActive(productId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ active }).eq("id", productId);
  revalidatePath("/productos");
}
