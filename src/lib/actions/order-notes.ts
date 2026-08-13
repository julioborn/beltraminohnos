"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CreateOrderState = { error: string } | undefined;

export async function createOrderNote(
  _prevState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const zonaId = String(formData.get("zona_id") ?? "") || null;
  const fecha = String(formData.get("fecha") ?? "") || null;
  const fechaEntrega = String(formData.get("fecha_entrega") ?? "") || null;
  const vendedorId = String(formData.get("vendedor_id") ?? "") || null;
  const choferId = String(formData.get("chofer_id") ?? "") || null;
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;
  const provincia = String(formData.get("provincia") ?? "").trim() || null;
  const localidad = String(formData.get("localidad") ?? "").trim() || null;
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!cliente) {
    return { error: "Ingresá el cliente." };
  }

  let items: unknown;
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Los productos de la nota son inválidos." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Agregá al menos un producto." };
  }

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_order_note", {
    p_cliente: cliente,
    p_zona_id: zonaId,
    p_fecha: fecha,
    p_fecha_entrega: fechaEntrega,
    p_vendedor_id: vendedorId,
    p_chofer_id: choferId,
    p_observaciones: observaciones,
    p_items: items,
    p_provincia: provincia,
    p_localidad: localidad,
  } as Database["public"]["Functions"]["create_order_note"]["Args"]);

  if (error) {
    return { error: `No se pudo crear la nota: ${error.message}` };
  }

  revalidatePath("/pedidos");
  redirect(`/pedidos/${orderId}`);
}

export async function marcarEntregado(orderId: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order_notes")
    .select("estado_produccion")
    .eq("id", orderId)
    .single();

  if (order?.estado_produccion !== "FABRICADO") {
    throw new Error("No se puede marcar como entregado: la producción todavía está pendiente.");
  }

  const { error } = await supabase.from("order_notes").update({ estado_logistica: "ENTREGADO" }).eq("id", orderId);
  if (error) throw new Error(`No se pudo marcar como entregado: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function marcarFabricado(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_notes").update({ estado_produccion: "FABRICADO" }).eq("id", orderId);
  if (error) throw new Error(`No se pudo marcar como fabricado: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function updateShippingDetails(orderId: string, formData: FormData) {
  const choferId = String(formData.get("chofer_id") ?? "") || null;
  const fechaEntrega = String(formData.get("fecha_entrega") ?? "") || null;
  const fechaEnvio = String(formData.get("fecha_envio") ?? "") || null;
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("order_notes")
    .update({
      chofer_id: choferId,
      fecha_entrega: fechaEntrega,
      fecha_envio: fechaEnvio,
      observaciones,
    })
    .eq("id", orderId);
  if (error) throw new Error(`No se pudieron guardar los cambios: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
}
