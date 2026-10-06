"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getSucursalByProfileId } from "@/lib/data/consignaciones";
import { getPriceMap } from "@/lib/data/master-data";
import { getDolarOficial } from "@/lib/dolar";
import type { Database } from "@/lib/supabase/database.types";

type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento_consignacion"];
type MovimientoInsert = Database["public"]["Tables"]["sucursal_movimientos"]["Insert"];

const IVA = 1.21;
const TIPOS_MOVIMIENTO: TipoMovimiento[] = ["INGRESO_STOCK", "VENTA", "DIRECTA_CLIENTE"];

type ParsedItem = { product_id: string; cantidad_bolsas: number };

export type CrearMovimientoState = { error: string } | undefined;

export async function crearMovimientosSucursal(
  _prevState: CrearMovimientoState,
  formData: FormData,
): Promise<CrearMovimientoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // El sucursal_id nunca sale de lo que mande el formulario para una cuenta
  // de sucursal normal — se resuelve contra el usuario logueado, igual que
  // el precio más abajo. La contadora y los admins son la única excepción:
  // ellos sí pueden elegir la sucursal, para cargar movimientos atrasados
  // de cualquiera (ej. historial que todavía no estaba en el sistema).
  const role = await getProfileRole();
  const puedeElegirSucursal = role === "contable" || hasFullAccess(role);

  const sucursal = puedeElegirSucursal
    ? await (async () => {
        const sucursalId = String(formData.get("sucursal_id") ?? "");
        if (!sucursalId) return null;
        const { data } = await supabase
          .from("sucursales")
          .select("id, name, cuit, zona_id, zona:zones(id, name)")
          .eq("id", sucursalId)
          .single();
        return data;
      })()
    : await getSucursalByProfileId(user.id);

  if (!sucursal) {
    return {
      error: puedeElegirSucursal
        ? "Seleccioná la sucursal para este movimiento."
        : "Tu cuenta no está vinculada a ninguna sucursal.",
    };
  }

  const tipo = String(formData.get("tipo_movimiento") ?? "");
  if (!TIPOS_MOVIMIENTO.includes(tipo as TipoMovimiento)) {
    return { error: "Seleccioná el tipo de movimiento." };
  }
  const tipoMovimiento = tipo as TipoMovimiento;

  const clienteNombre = String(formData.get("cliente_nombre") ?? "").trim() || null;
  const clienteCuit = String(formData.get("cliente_cuit") ?? "").trim() || null;
  const fecha = String(formData.get("fecha") ?? "") || new Date().toISOString().slice(0, 10);
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  if (tipoMovimiento === "DIRECTA_CLIENTE" && !clienteNombre) {
    return { error: "Ingresá el cliente al que se le factura esta venta directa." };
  }

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Los productos cargados son inválidos." };
  }

  const items: ParsedItem[] = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
        .map((it) => ({
          product_id: String(it.product_id ?? ""),
          cantidad_bolsas: Number(it.cantidad_bolsas ?? 0),
        }))
        .filter((it) => it.product_id && it.cantidad_bolsas > 0)
    : [];

  if (items.length === 0) return { error: "Agregá al menos un producto." };

  const inserts: MovimientoInsert[] = [];

  if (tipoMovimiento === "INGRESO_STOCK") {
    for (const it of items) {
      inserts.push({
        sucursal_id: sucursal.id,
        fecha,
        tipo_movimiento: tipoMovimiento,
        product_id: it.product_id,
        cantidad_bolsas: it.cantidad_bolsas,
        observaciones,
        created_by: user.id,
      });
    }
  } else {
    const [productsRes, priceMap, dolar] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, kg_por_bolsa, comision_pct")
        .in("id", items.map((it) => it.product_id)),
      getPriceMap(),
      getDolarOficial(),
    ]);

    if (dolar.venta === null) {
      return { error: "No se pudo obtener la cotización del dólar. Probá de nuevo en unos minutos." };
    }

    const productById = new Map((productsRes.data ?? []).map((p) => [p.id, p]));
    const missing = new Set<string>();

    for (const it of items) {
      const product = productById.get(it.product_id);
      if (!product) {
        missing.add("producto desconocido");
        continue;
      }
      const precioUsd = priceMap[`${it.product_id}_BOLSA_${sucursal.zona_id}`];
      if (precioUsd === null || precioUsd === undefined) {
        missing.add(product.name);
      }
    }

    if (missing.size > 0) {
      return {
        error: `Falta cargar el precio de ${Array.from(missing).join(", ")} para la zona de la sucursal. Avisale a BTM para que lo cargue en Productos y precios.`,
      };
    }

    for (const it of items) {
      const product = productById.get(it.product_id)!;
      const precioUsd = priceMap[`${it.product_id}_BOLSA_${sucursal.zona_id}`]!;
      const toneladas = (it.cantidad_bolsas * product.kg_por_bolsa) / 1000;
      const montoArs = toneladas * precioUsd * dolar.venta * IVA;

      const insert: MovimientoInsert = {
        sucursal_id: sucursal.id,
        fecha,
        tipo_movimiento: tipoMovimiento,
        product_id: it.product_id,
        cantidad_bolsas: it.cantidad_bolsas,
        cliente_nombre: clienteNombre,
        cliente_cuit: clienteCuit,
        observaciones,
        created_by: user.id,
        precio_usd: precioUsd,
        tipo_cambio: dolar.venta,
        monto_ars: montoArs,
      };

      if (tipoMovimiento === "DIRECTA_CLIENTE" && product.comision_pct !== null) {
        insert.comision_pct = product.comision_pct;
        insert.comision_ars = montoArs * (product.comision_pct / 100);
      }

      inserts.push(insert);
    }
  }

  const { error } = await supabase.from("sucursal_movimientos").insert(inserts);
  if (error) return { error: `No se pudo guardar el movimiento: ${error.message}` };

  revalidatePath("/consignaciones");
  revalidatePath("/consignaciones/mi-sucursal");
  return undefined;
}

export type ActualizarMovimientoState = { error: string } | undefined;

// Solo contable/admin corrigen movimientos ya cargados (típicamente por un
// cliente de sucursal, sin revisión previa) — fecha, producto y cantidad.
// El precio USD y el tipo de cambio quedan históricos (los que ya tenía
// guardados ese movimiento); el monto en ARS y la comisión se recalculan
// a partir de esos valores históricos, no de una cotización nueva.
export async function actualizarMovimientoSucursal(
  _prevState: ActualizarMovimientoState,
  formData: FormData,
): Promise<ActualizarMovimientoState> {
  const role = await getProfileRole();
  if (role !== "admin" && role !== "contable") {
    return { error: "No autorizado." };
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Movimiento inválido." };

  const fecha = String(formData.get("fecha") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const cantidadBolsas = Number(formData.get("cantidad_bolsas") ?? 0);

  if (!fecha) return { error: "Ingresá la fecha." };
  if (!productId) return { error: "Seleccioná el producto." };
  if (!cantidadBolsas || cantidadBolsas <= 0) return { error: "Ingresá una cantidad de bolsas válida." };

  const [existingRes, productRes] = await Promise.all([
    supabase
      .from("sucursal_movimientos")
      .select("tipo_movimiento, precio_usd, tipo_cambio, comision_pct")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("products").select("kg_por_bolsa").eq("id", productId).single(),
  ]);

  if (!existingRes.data) return { error: "El movimiento no existe." };
  if (!productRes.data) return { error: "Producto inválido." };

  const existing = existingRes.data;
  const product = productRes.data;

  const update: Database["public"]["Tables"]["sucursal_movimientos"]["Update"] = {
    fecha,
    product_id: productId,
    cantidad_bolsas: cantidadBolsas,
  };

  if (existing.tipo_movimiento !== "INGRESO_STOCK" && existing.precio_usd !== null && existing.tipo_cambio !== null) {
    const toneladas = (cantidadBolsas * product.kg_por_bolsa) / 1000;
    const montoArs = toneladas * existing.precio_usd * existing.tipo_cambio * IVA;
    update.monto_ars = montoArs;
    if (existing.comision_pct !== null) {
      update.comision_ars = montoArs * (existing.comision_pct / 100);
    }
  }

  const { error } = await supabase.from("sucursal_movimientos").update(update).eq("id", id);
  if (error) return { error: `No se pudo actualizar el movimiento: ${error.message}` };

  revalidatePath("/consignaciones");
  revalidatePath("/consignaciones/mi-sucursal");
  return undefined;
}

export async function marcarMovimientosFacturados(ids: string[]) {
  const role = await getProfileRole();
  if (role !== "admin" && role !== "contable") {
    throw new Error("No autorizado.");
  }
  if (ids.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sucursal_movimientos")
    .update({ estado_facturacion: "FACTURADO" })
    .in("id", ids);
  if (error) throw new Error(`No se pudo marcar como facturado: ${error.message}`);

  revalidatePath("/consignaciones");
}
