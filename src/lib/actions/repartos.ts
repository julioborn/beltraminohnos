"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CreateRepartoState = { error: string } | undefined;

export async function createReparto(
  _prevState: CreateRepartoState,
  formData: FormData,
): Promise<CreateRepartoState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) {
    return { error: "Ingresá un nombre para el reparto." };
  }

  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const choferId = String(formData.get("chofer_id") ?? "") || null;
  const camionIds = formData.getAll("camion_id").map(String).filter(Boolean);
  const orderNoteIds = formData.getAll("order_note_id").map(String).filter(Boolean);

  if (orderNoteIds.length === 0) {
    return { error: "Seleccioná al menos una nota." };
  }

  const supabase = await createClient();
  const { data: repartoId, error } = await supabase.rpc("create_reparto", {
    p_nombre: nombre,
    p_descripcion: descripcion,
    p_chofer_id: choferId,
    p_camion_ids: camionIds,
    p_order_note_ids: orderNoteIds,
  } as Database["public"]["Functions"]["create_reparto"]["Args"]);

  if (error) {
    return { error: `No se pudo crear el reparto: ${error.message}` };
  }

  revalidatePath("/repartos");
  redirect(`/repartos/${repartoId}`);
}

export async function deleteReparto(repartoId: string): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.from("repartos").delete().eq("id", repartoId);

  if (error) {
    return { error: `No se pudo eliminar el reparto: ${error.message}` };
  }

  revalidatePath("/repartos");
  redirect("/repartos");
}
