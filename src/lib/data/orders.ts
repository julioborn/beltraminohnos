import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Estado = Database["public"]["Enums"]["order_status"];

export type OrderListFilters = {
  q?: string;
  estado?: string;
  zona?: string;
  vendedor?: string;
  chofer?: string;
  producto?: string;
  desde?: string;
  hasta?: string;
};

const LIST_SELECT_BASE = `id, numero, cliente, fecha, dia_entrega, fecha_envio, estado,
  zona:zones(name), vendedor:vendedores(name), chofer:choferes(name)`;

export async function getOrderNotesList(params: OrderListFilters) {
  const supabase = await createClient();
  const hasProducto = Boolean(params.producto);

  let query = supabase
    .from("order_notes")
    .select(
      hasProducto
        ? `${LIST_SELECT_BASE}, items:order_items!inner(id, cantidad, tipo_envase, precio_unitario, product:products(name))`
        : `${LIST_SELECT_BASE}, items:order_items(id, cantidad, tipo_envase, precio_unitario, product:products(name))`,
    )
    .order("fecha", { ascending: false });

  if (params.q) {
    query = query.or(`numero.ilike.%${params.q}%,cliente.ilike.%${params.q}%`);
  }
  if (params.estado) query = query.eq("estado", params.estado as Estado);
  if (params.zona) query = query.eq("zona_id", params.zona);
  if (params.vendedor) query = query.eq("vendedor_id", params.vendedor);
  if (params.chofer) query = query.eq("chofer_id", params.chofer);
  if (params.producto) query = query.eq("order_items.product_id", params.producto);
  if (params.desde) query = query.gte("fecha", params.desde);
  if (params.hasta) query = query.lte("fecha", params.hasta);

  const { data } = await query.limit(200);
  return data ?? [];
}

export async function getOrderNoteDetail(id: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order_notes")
    .select(
      `id, numero, cliente, fecha, dia_entrega, fecha_envio, observaciones, estado,
       zona:zones(name), vendedor:vendedores(name), chofer:choferes(id, name),
       items:order_items(id, cantidad, tipo_envase, precio_unitario, product:products(name))`,
    )
    .eq("id", id)
    .single();

  if (!order) return null;

  const { data: history } = await supabase
    .from("order_status_history")
    .select("id, estado, changed_at")
    .eq("order_note_id", id)
    .order("changed_at", { ascending: true });

  return { order, history: history ?? [] };
}
