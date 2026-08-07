"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_ORDER } from "@/components/estado-badge";
import type { Database } from "@/lib/supabase/database.types";

type Estado = Database["public"]["Enums"]["order_status"];

export type CreateOrderState = { error: string } | undefined;

export async function createOrderNote(
  _prevState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const zonaId = String(formData.get("zona_id") ?? "") || null;
  const fecha = String(formData.get("fecha") ?? "") || null;
  const diaEntrega = String(formData.get("dia_entrega") ?? "").trim() || null;
  const vendedorId = String(formData.get("vendedor_id") ?? "") || null;
  const choferId = String(formData.get("chofer_id") ?? "") || null;
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;
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
    p_dia_entrega: diaEntrega,
    p_vendedor_id: vendedorId,
    p_chofer_id: choferId,
    p_observaciones: observaciones,
    p_items: items,
  });

  if (error) {
    return { error: `No se pudo crear la nota: ${error.message}` };
  }

  revalidatePath("/pedidos");
  redirect(`/pedidos/${orderId}`);
}

export async function advanceOrderStatus(orderId: string, currentEstado: Estado) {
  const currentIndex = ESTADO_ORDER.indexOf(currentEstado);
  const nextEstado = ESTADO_ORDER[currentIndex + 1];
  if (!nextEstado) return;

  const supabase = await createClient();
  await supabase.from("order_notes").update({ estado: nextEstado }).eq("id", orderId);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function setOrderStatus(orderId: string, estado: Estado) {
  const supabase = await createClient();
  await supabase.from("order_notes").update({ estado }).eq("id", orderId);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function updateShippingDetails(orderId: string, formData: FormData) {
  const choferId = String(formData.get("chofer_id") ?? "") || null;
  const diaEntrega = String(formData.get("dia_entrega") ?? "").trim() || null;
  const fechaEnvio = String(formData.get("fecha_envio") ?? "") || null;
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  const supabase = await createClient();
  await supabase
    .from("order_notes")
    .update({
      chofer_id: choferId,
      dia_entrega: diaEntrega,
      fecha_envio: fechaEnvio,
      observaciones,
    })
    .eq("id", orderId);

  revalidatePath(`/pedidos/${orderId}`);
}
