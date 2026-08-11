"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateCamionState = { error: string } | undefined;

export async function createCamion(
  _prevState: CreateCamionState,
  formData: FormData,
): Promise<CreateCamionState> {
  const dominio = String(formData.get("dominio") ?? "").trim().toUpperCase();
  const tipo = String(formData.get("tipo") ?? "").trim().toUpperCase();
  const marcaModelo = String(formData.get("marca_modelo") ?? "").trim();
  const anioRaw = String(formData.get("anio") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim().toUpperCase();
  const choferId = String(formData.get("chofer_id") ?? "").trim();

  if (!dominio || !tipo) {
    return { error: "Ingresá al menos dominio y tipo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("camiones").insert({
    dominio,
    tipo,
    marca_modelo: marcaModelo || null,
    anio: anioRaw ? Number(anioRaw) : null,
    empresa: empresa || null,
    chofer_id: choferId || null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un vehículo con ese dominio." : `No se pudo crear: ${error.message}`,
    };
  }

  revalidatePath("/personal");
  return undefined;
}

export async function updateCamion(
  camionId: string,
  fields: { tipo?: string; marca_modelo?: string | null; anio?: number | null; empresa?: string | null; dominio?: string; chofer_id?: string | null },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("camiones").update(fields).eq("id", camionId);

  revalidatePath("/personal");
  return { error: error?.message };
}

export async function setCamionActive(camionId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("camiones").update({ active }).eq("id", camionId);
  revalidatePath("/personal");
}

export async function deleteCamion(camionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("camiones").delete().eq("id", camionId);

  revalidatePath("/personal");
  return { error: error?.message };
}
