import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type LogisticaEstado = Database["public"]["Enums"]["logistica_status"];
type ProduccionEstado = Database["public"]["Enums"]["produccion_status"];

export type OrderListFilters = {
  q?: string;
  estado_logistica?: string;
  estado_produccion?: string;
  zona?: string;
  vendedor?: string;
  chofer?: string;
  producto?: string;
  desde?: string;
  hasta?: string;
};

const LIST_SELECT_BASE = `id, numero, cliente, fecha, fecha_entrega, fecha_envio, estado_logistica, estado_produccion, provincia, localidad,
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
    query = query.or(
      `numero.ilike.%${params.q}%,cliente.ilike.%${params.q}%,provincia.ilike.%${params.q}%,localidad.ilike.%${params.q}%`,
    );
  }
  if (params.estado_logistica) query = query.eq("estado_logistica", params.estado_logistica as LogisticaEstado);
  if (params.estado_produccion) query = query.eq("estado_produccion", params.estado_produccion as ProduccionEstado);
  if (params.zona) query = query.eq("zona_id", params.zona);
  if (params.vendedor) query = query.eq("vendedor_id", params.vendedor);
  if (params.chofer) query = query.eq("chofer_id", params.chofer);
  if (params.producto) query = query.eq("order_items.product_id", params.producto);
  if (params.desde) query = query.gte("fecha", params.desde);
  if (params.hasta) query = query.lte("fecha", params.hasta);

  const { data } = await query.limit(200);
  return data ?? [];
}

export type ReportFilters = { desde?: string; hasta?: string };

export async function getOrdersForReports(filters: ReportFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("order_notes")
    .select(
      `id, cliente, fecha, estado_logistica, estado_produccion,
       zona:zones(name), vendedor:vendedores(name),
       items:order_items(cantidad, precio_unitario, product:products(name))`,
    )
    .order("fecha", { ascending: true });

  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);

  const { data } = await query.limit(5000);
  return data ?? [];
}

export async function getOrderNoteDetail(id: string) {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order_notes")
    .select(
      `id, numero, cliente, fecha, fecha_entrega, fecha_envio, observaciones, estado_logistica, estado_produccion, provincia, localidad,
       zona:zones(name), vendedor:vendedores(name), chofer:choferes(id, name),
       items:order_items(id, cantidad, tipo_envase, precio_unitario, product:products(name))`,
    )
    .eq("id", id)
    .single();

  if (!order) return null;

  const { data: history } = await supabase
    .from("order_status_history")
    .select("id, estado, campo, changed_at")
    .eq("order_note_id", id)
    .order("changed_at", { ascending: true });

  return { order, history: history ?? [] };
}
