"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBusinessDays } from "@/lib/date-range";
import { formatFecha } from "@/lib/format";
import { getAllProducts, getPriceMap } from "@/lib/data/master-data";
import { pricingPackagingType, type PackagingType } from "@/lib/packaging";
import type { Database } from "@/lib/supabase/database.types";

const MIN_DIAS_HABILES_ENTREGA = 4;

type ParsedItem = { product_id: string; tipo_envase: PackagingType; cantidad: number };
type PricedItem = ParsedItem & { precio_unitario: number };

// El precio nunca se toma de lo que mande el navegador — se resuelve siempre
// acá contra la lista de precios real, y si a algún producto le falta el
// precio para la zona elegida, se rechaza la nota en vez de guardarla en $0
// en silencio (así se coló la falta de precio de TERNERO 16% PREMIUM).
async function resolveItemPrices(
  zonaId: string | null,
  rawItems: unknown[],
): Promise<{ items: PricedItem[]; error?: undefined } | { items?: undefined; error: string }> {
  if (!zonaId) {
    return { error: "Seleccioná una zona comercial antes de guardar." };
  }

  const items: ParsedItem[] = rawItems
    .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
    .map((it) => ({
      product_id: String(it.product_id ?? ""),
      tipo_envase: String(it.tipo_envase ?? "") as PackagingType,
      cantidad: Number(it.cantidad ?? 0),
    }))
    .filter((it) => it.product_id && it.cantidad > 0);

  if (items.length === 0) {
    return { error: "Agregá al menos un producto." };
  }

  const [products, priceMap] = await Promise.all([getAllProducts(), getPriceMap()]);
  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  const missing = new Set<string>();
  const resolved: PricedItem[] = items.map((it) => {
    const packagingType = pricingPackagingType(it.tipo_envase);
    const price = priceMap[`${it.product_id}_${packagingType}_${zonaId}`];
    if (price === null || price === undefined) {
      missing.add(productNameById.get(it.product_id) ?? "producto desconocido");
    }
    return { ...it, precio_unitario: price ?? 0 };
  });

  if (missing.size > 0) {
    return {
      error: `Falta cargar el precio de ${Array.from(missing).join(", ")} para esta zona. Cargalo en Productos y precios antes de guardar la nota.`,
    };
  }

  return { items: resolved };
}

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
  const camionIds = formData.getAll("camion_id").map(String).filter(Boolean);
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;
  const provincia = String(formData.get("provincia") ?? "").trim() || null;
  const localidad = String(formData.get("localidad") ?? "").trim() || null;
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!cliente) {
    return { error: "Ingresá el cliente." };
  }

  if (!fechaEntrega) {
    return { error: "Ingresá la fecha de entrega estimada." };
  }

  const emisionBase = fecha ?? new Date().toISOString().slice(0, 10);
  const minFechaEntrega = addBusinessDays(emisionBase, MIN_DIAS_HABILES_ENTREGA);
  if (fechaEntrega < minFechaEntrega) {
    return {
      error: `La fecha de entrega debe ser al menos ${MIN_DIAS_HABILES_ENTREGA} días hábiles después de la emisión (mínimo ${formatFecha(minFechaEntrega)}), por el tiempo de fabricación.`,
    };
  }

  let itemsRawParsed: unknown;
  try {
    itemsRawParsed = JSON.parse(itemsRaw);
  } catch {
    return { error: "Los productos de la nota son inválidos." };
  }

  if (!Array.isArray(itemsRawParsed) || itemsRawParsed.length === 0) {
    return { error: "Agregá al menos un producto." };
  }

  const priced = await resolveItemPrices(zonaId, itemsRawParsed);
  if (priced.error) {
    return { error: priced.error };
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
    p_items: priced.items,
    p_provincia: provincia,
    p_localidad: localidad,
  } as Database["public"]["Functions"]["create_order_note"]["Args"]);

  if (error) {
    return { error: `No se pudo crear la nota: ${error.message}` };
  }

  if (camionIds.length > 0) {
    await supabase
      .from("order_note_camiones")
      .insert(camionIds.map((camion_id) => ({ order_note_id: orderId as string, camion_id })));
  }

  revalidatePath("/pedidos");
  revalidatePath("/mis-notas");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (profile?.role === "limitado") {
    redirect("/pedidos/nuevo?created=1");
  }

  redirect(`/pedidos/${orderId}`);
}

export type UpdateOrderState = { error: string } | undefined;

export async function updateOrderNoteCore(
  orderId: string,
  _prevState: UpdateOrderState,
  formData: FormData,
): Promise<UpdateOrderState> {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const zonaId = String(formData.get("zona_id") ?? "") || null;
  const fecha = String(formData.get("fecha") ?? "") || null;
  const vendedorId = String(formData.get("vendedor_id") ?? "") || null;
  const provincia = String(formData.get("provincia") ?? "").trim() || null;
  const localidad = String(formData.get("localidad") ?? "").trim() || null;
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!cliente) {
    return { error: "Ingresá el cliente." };
  }

  let itemsRawParsed: unknown;
  try {
    itemsRawParsed = JSON.parse(itemsRaw);
  } catch {
    return { error: "Los productos de la nota son inválidos." };
  }

  if (!Array.isArray(itemsRawParsed) || itemsRawParsed.length === 0) {
    return { error: "Agregá al menos un producto." };
  }

  const priced = await resolveItemPrices(zonaId, itemsRawParsed);
  if (priced.error) {
    return { error: priced.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_note", {
    p_order_id: orderId,
    p_cliente: cliente,
    p_zona_id: zonaId,
    p_fecha: fecha,
    p_vendedor_id: vendedorId,
    p_items: priced.items,
    p_provincia: provincia,
    p_localidad: localidad,
  } as Database["public"]["Functions"]["update_order_note"]["Args"]);

  if (error) {
    return { error: `No se pudieron guardar los cambios: ${error.message}` };
  }

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function deleteOrderNote(orderId: string): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.from("order_notes").delete().eq("id", orderId);

  if (error) {
    return { error: `No se pudo eliminar la nota: ${error.message}` };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function marcarItemFabricado(orderId: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").update({ estado_produccion: "FABRICADO" }).eq("id", itemId);
  if (error) throw new Error(`No se pudo marcar el producto como fabricado: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function marcarItemEntregado(orderId: string, itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("order_items")
    .select("estado_produccion")
    .eq("id", itemId)
    .single();

  if (item?.estado_produccion !== "FABRICADO") {
    throw new Error("No se puede marcar como entregado: la producción de este producto todavía está pendiente.");
  }

  const { error } = await supabase.from("order_items").update({ estado_logistica: "ENTREGADO" }).eq("id", itemId);
  if (error) throw new Error(`No se pudo marcar el producto como entregado: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function revertirItemFabricado(orderId: string, itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("order_items")
    .select("estado_logistica")
    .eq("id", itemId)
    .single();

  if (item?.estado_logistica === "ENTREGADO") {
    throw new Error("No se puede revertir: primero revertí la entrega de este producto.");
  }

  const { error } = await supabase.from("order_items").update({ estado_produccion: "PENDIENTE" }).eq("id", itemId);
  if (error) throw new Error(`No se pudo revertir el producto a pendiente: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function revertirItemEntregado(orderId: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").update({ estado_logistica: "PENDIENTE" }).eq("id", itemId);
  if (error) throw new Error(`No se pudo revertir la entrega del producto: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function marcarTodosFabricado(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_items")
    .update({ estado_produccion: "FABRICADO" })
    .eq("order_note_id", orderId)
    .eq("estado_produccion", "PENDIENTE");
  if (error) throw new Error(`No se pudo marcar la nota como fabricada: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function marcarTodosEntregado(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_items")
    .update({ estado_logistica: "ENTREGADO" })
    .eq("order_note_id", orderId)
    .eq("estado_produccion", "FABRICADO")
    .eq("estado_logistica", "PENDIENTE");
  if (error) throw new Error(`No se pudo marcar la nota como entregada: ${error.message}`);

  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/pedidos");
}

export async function updateShippingDetails(orderId: string, formData: FormData) {
  const camionIds = formData.getAll("camion_id").map(String).filter(Boolean);
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

  await supabase.from("order_note_camiones").delete().eq("order_note_id", orderId);
  if (camionIds.length > 0) {
    await supabase
      .from("order_note_camiones")
      .insert(camionIds.map((camion_id) => ({ order_note_id: orderId, camion_id })));
  }

  revalidatePath(`/pedidos/${orderId}`);
}
