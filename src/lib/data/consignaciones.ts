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

const MOVIMIENTO_SELECT = `id, fecha, tipo_movimiento, cantidad_bolsas, precio_usd_kg, tipo_cambio,
  cliente_nombre, cliente_cuit, monto_ars, estado_facturacion, n_factura, remito, observaciones,
  sucursal:sucursales(id, name), product:products(id, name)`;

export async function getSucursales() {
  const supabase = await createClient();
  const { data } = await supabase.from("sucursales").select("id, name, cuit, profile_id, active").order("name");
  return data ?? [];
}

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
