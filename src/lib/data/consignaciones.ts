import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento_consignacion"];
type EstadoFacturacion = Database["public"]["Enums"]["estado_facturacion_consignacion"];

export type ConsignacionFilters = {
  desde?: string;
  hasta?: string;
  sucursal?: string;
  tipo?: string;
  estado?: string;
};

const MOVIMIENTO_SELECT = `id, fecha, tipo_movimiento, cantidad_bolsas, precio_usd, tipo_cambio,
  cliente_nombre, cliente_cuit, monto_ars, comision_pct, comision_ars, estado_facturacion,
  n_factura, remito, observaciones,
  sucursal:sucursales(id, name), product:products(id, name)`;

export async function getSucursales() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucursales")
    .select("id, name, cuit, profile_id, active, zona_id, zona:zones(id, name)")
    .order("name");
  return data ?? [];
}

// El layout (para el link "Mi sucursal") y la propia página la piden por
// separado en la misma request — cache() evita pedirla dos veces.
export const getSucursalByProfileId = cache(async (profileId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucursales")
    .select("id, name, cuit, zona_id, zona:zones(id, name)")
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();
  return data;
});

export async function getSucursalMovimientos(filters: ConsignacionFilters) {
  const supabase = await createClient();
  let query = supabase.from("sucursal_movimientos").select(MOVIMIENTO_SELECT).order("fecha", { ascending: false });

  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);
  if (filters.sucursal) query = query.eq("sucursal_id", filters.sucursal);
  if (filters.tipo) query = query.eq("tipo_movimiento", filters.tipo as TipoMovimiento);
  if (filters.estado) query = query.eq("estado_facturacion", filters.estado as EstadoFacturacion);

  const { data } = await query.limit(500);
  return data ?? [];
}

export async function getSucursalPagos(filters: Pick<ConsignacionFilters, "desde" | "hasta" | "sucursal">) {
  const supabase = await createClient();
  let query = supabase
    .from("sucursal_pagos")
    .select("id, fecha, formato_pago, comprobante, importe_ars, observaciones, sucursal:sucursales(id, name)")
    .order("fecha", { ascending: false });

  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);
  if (filters.sucursal) query = query.eq("sucursal_id", filters.sucursal);

  const { data } = await query.limit(500);
  return data ?? [];
}

export type SucursalSaldo = {
  sucursalId: string;
  sucursalName: string;
  totalVentas: number;
  totalFacturado: number;
  totalPendienteFacturar: number;
  totalPagado: number;
  saldo: number;
};

export async function getSucursalSaldos(): Promise<SucursalSaldo[]> {
  const supabase = await createClient();

  const [sucursalesRes, movimientosRes, pagosRes] = await Promise.all([
    supabase.from("sucursales").select("id, name").order("name"),
    supabase
      .from("sucursal_movimientos")
      .select("sucursal_id, tipo_movimiento, monto_ars, estado_facturacion")
      .in("tipo_movimiento", ["VENTA", "DIRECTA_CLIENTE"]),
    supabase.from("sucursal_pagos").select("sucursal_id, importe_ars"),
  ]);

  const sucursales = sucursalesRes.data ?? [];
  const movimientos = movimientosRes.data ?? [];
  const pagos = pagosRes.data ?? [];

  return sucursales.map((s) => {
    const ventas = movimientos.filter((m) => m.sucursal_id === s.id);
    const totalVentas = ventas.reduce((sum, m) => sum + (m.monto_ars ?? 0), 0);
    const totalFacturado = ventas
      .filter((m) => m.estado_facturacion === "FACTURADO")
      .reduce((sum, m) => sum + (m.monto_ars ?? 0), 0);
    const totalPagado = pagos
      .filter((p) => p.sucursal_id === s.id)
      .reduce((sum, p) => sum + p.importe_ars, 0);

    return {
      sucursalId: s.id,
      sucursalName: s.name,
      totalVentas,
      totalFacturado,
      totalPendienteFacturar: totalVentas - totalFacturado,
      totalPagado,
      saldo: totalVentas - totalPagado,
    };
  });
}

export type StockFisicoRow = {
  sucursalId: string;
  sucursalName: string;
  productId: string;
  productName: string;
  bolsas: number;
};

export async function getStockFisico(): Promise<StockFisicoRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sucursal_movimientos")
    .select("tipo_movimiento, cantidad_bolsas, sucursal:sucursales(id, name), product:products(id, name)");

  const map = new Map<string, StockFisicoRow>();
  for (const m of data ?? []) {
    if (!m.sucursal || !m.product) continue;
    const key = `${m.sucursal.id}_${m.product.id}`;
    const row = map.get(key) ?? {
      sucursalId: m.sucursal.id,
      sucursalName: m.sucursal.name,
      productId: m.product.id,
      productName: m.product.name,
      bolsas: 0,
    };
    row.bolsas += m.tipo_movimiento === "INGRESO_STOCK" ? m.cantidad_bolsas : -m.cantidad_bolsas;
    map.set(key, row);
  }

  return Array.from(map.values())
    .filter((r) => r.bolsas !== 0)
    .sort((a, b) => a.sucursalName.localeCompare(b.sucursalName) || a.productName.localeCompare(b.productName));
}

export type VentaPorProducto = { productName: string; bolsas: number; montoArs: number };

export async function getVentasPorProducto(filters: Pick<ConsignacionFilters, "desde" | "hasta">): Promise<VentaPorProducto[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sucursal_movimientos")
    .select("cantidad_bolsas, monto_ars, product:products(name)")
    .in("tipo_movimiento", ["VENTA", "DIRECTA_CLIENTE"]);

  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);

  const { data } = await query;

  const map = new Map<string, VentaPorProducto>();
  for (const m of data ?? []) {
    const label = m.product?.name ?? "—";
    const row = map.get(label) ?? { productName: label, bolsas: 0, montoArs: 0 };
    row.bolsas += m.cantidad_bolsas;
    row.montoArs += m.monto_ars ?? 0;
    map.set(label, row);
  }

  return Array.from(map.values()).sort((a, b) => b.montoArs - a.montoArs);
}
