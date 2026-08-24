import { createClient } from "@/lib/supabase/server";
import { LIST_SELECT_BASE } from "./orders";

export async function getRepartos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("repartos")
    .select(
      `id, nombre, descripcion, created_at, chofer:choferes(name),
       camiones:reparto_camiones(camion_id), notes:reparto_notes(order_note_id)`,
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getRepartoDetail(id: string) {
  const supabase = await createClient();

  const { data: reparto } = await supabase
    .from("repartos")
    .select(
      `id, nombre, descripcion, created_at, chofer:choferes(id, name),
       camiones:reparto_camiones(camion:camiones(id, dominio, tipo, marca_modelo, anio, empresa))`,
    )
    .eq("id", id)
    .single();

  if (!reparto) return null;

  const { data: noteLinks } = await supabase
    .from("reparto_notes")
    .select(
      `order_note:order_notes(${LIST_SELECT_BASE}, items:order_items(id, cantidad, tipo_envase, precio_unitario, product:products(name)))`,
    )
    .eq("reparto_id", id);

  const notes = (noteLinks ?? []).map((l) => l.order_note).filter((n) => n !== null);

  return { reparto, notes };
}
