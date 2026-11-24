"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ZonaState = { error: string } | undefined;

function str(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s || null;
}

function revalidateZonaPaths() {
  revalidatePath("/productos");
  revalidatePath("/productos/zonas");
  revalidatePath("/productos/importar-precios");
}

// Sin borrado por ahora: zone_id lo referencian prices y sucursales
// (Consignaciones), y zones no tiene una columna "active" para dar de baja
// sin romper esas referencias — solo alta y edición (código, nombre, orden).
export async function crearZona(_prevState: ZonaState, formData: FormData): Promise<ZonaState> {
  const code = str(formData.get("code"));
  const name = str(formData.get("name"));
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

  if (!code) return { error: "Ingresá el código de la zona." };
  if (!name) return { error: "Ingresá el nombre de la zona." };

  const supabase = await createClient();
  const { error } = await supabase.from("zones").insert({ code, name, sort_order: sortOrder });
  if (error) return { error: `No se pudo crear la zona: ${error.message}` };

  revalidateZonaPaths();
  return undefined;
}

export async function actualizarZona(_prevState: ZonaState, formData: FormData): Promise<ZonaState> {
  const id = str(formData.get("id"));
  const code = str(formData.get("code"));
  const name = str(formData.get("name"));
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

  if (!id) return { error: "Zona inválida." };
  if (!code) return { error: "Ingresá el código de la zona." };
  if (!name) return { error: "Ingresá el nombre de la zona." };

  const supabase = await createClient();
  const { error } = await supabase.from("zones").update({ code, name, sort_order: sortOrder }).eq("id", id);
  if (error) return { error: `No se pudo actualizar la zona: ${error.message}` };

  revalidateZonaPaths();
  return undefined;
}
