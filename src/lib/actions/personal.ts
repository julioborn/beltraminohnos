"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreatePersonState = { error: string } | undefined;

function createFor(table: "vendedores" | "choferes") {
  return async function create(
    _prevState: CreatePersonState,
    formData: FormData,
  ): Promise<CreatePersonState> {
    const name = String(formData.get("name") ?? "").trim().toUpperCase();

    if (!name) {
      return { error: "Ingresá el nombre." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from(table).insert({ name });

    if (error) {
      return {
        error: error.code === "23505" ? "Ya existe con ese nombre." : `No se pudo crear: ${error.message}`,
      };
    }

    revalidatePath("/personal");
    return undefined;
  };
}

function renameFor(table: "vendedores" | "choferes") {
  return async function rename(id: string, name: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from(table)
      .update({ name: name.trim().toUpperCase() })
      .eq("id", id);

    revalidatePath("/personal");
    return { error: error?.message };
  };
}

function setActiveFor(table: "vendedores" | "choferes") {
  return async function setActive(id: string, active: boolean) {
    const supabase = await createClient();
    await supabase.from(table).update({ active }).eq("id", id);
    revalidatePath("/personal");
  };
}

function deleteFor(table: "vendedores" | "choferes") {
  return async function remove(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);

    revalidatePath("/personal");

    if (error) {
      return {
        error:
          error.code === "23503"
            ? "No se puede eliminar: tiene notas de pedido asociadas. Podés desactivarlo en su lugar."
            : `No se pudo eliminar: ${error.message}`,
      };
    }
    return { error: undefined };
  };
}

export const createVendedor = createFor("vendedores");
export const renameVendedor = renameFor("vendedores");
export const setVendedorActive = setActiveFor("vendedores");
export const deleteVendedor = deleteFor("vendedores");

export const createChofer = createFor("choferes");
export const renameChofer = renameFor("choferes");
export const setChoferActive = setActiveFor("choferes");
export const deleteChofer = deleteFor("choferes");
