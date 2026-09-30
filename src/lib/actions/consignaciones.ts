"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfileRole } from "@/lib/auth/role";
import { getSucursalByProfileId } from "@/lib/data/consignaciones";
import { getPriceMap } from "@/lib/data/master-data";
import { getDolarOficial } from "@/lib/dolar";
import type { Database } from "@/lib/supabase/database.types";

type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento_consignacion"];
type MovimientoInsert = Database["public"]["Tables"]["sucursal_movimientos"]["Insert"];

const IVA = 1.21;
const TIPOS_MOVIMIENTO: TipoMovimiento[] = ["INGRESO_STOCK", "VENTA", "DIRECTA_CLIENTE"];

export type CrearMovimientoState = { error: string } | undefined;

export async function crearMovimientoSucursal(
  _prevState: CrearMovimientoState,
  formData: FormData,
): Promise<CrearMovimientoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // El sucursal_id nunca sale de lo que mande el formulario — se resuelve
  // siempre contra el usuario logueado, igual que el precio más abajo.
  const sucursal = await getSucursalByProfileId(user.id);
  if (!sucursal) return { error: "Tu cuenta no está vinculada a ninguna sucursal." };

  const tipo = String(formData.get("tipo_movimiento") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const cantidadBolsas = Number(formData.get("cantidad_bolsas") ?? 0);
  const clienteNombre = String(formData.get("cliente_nombre") ?? "").trim() || null;
  const clienteCuit = String(formData.get("cliente_cuit") ?? "").trim() || null;
  const fecha = String(formData.get("fecha") ?? "") || new Date().toISOString().slice(0, 10);
  const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

  if (!TIPOS_MOVIMIENTO.includes(tipo as TipoMovimiento)) {
    return { error: "Seleccioná el tipo de movimiento." };
  }
  const tipoMovimiento = tipo as TipoMovimiento;
  if (!productId) return { error: "Seleccioná un producto." };
  if (!cantidadBolsas || cantidadBolsas <= 0) return { error: "Ingresá la cantidad de bolsas." };
  if (tipoMovimiento === "DIRECTA_CLIENTE" && !clienteNombre) {
    return { error: "Ingresá el cliente al que se le factura esta venta directa." };
  }

  const insert: MovimientoInsert = {
    sucursal_id: sucursal.id,
    fecha,
    tipo_movimiento: tipoMovimiento,
    product_id: productId,
    cantidad_bolsas: cantidadBolsas,
    cliente_nombre: clienteNombre,
    cliente_cuit: clienteCuit,
    observaciones,
    created_by: user.id,
  };

  if (tipoMovimiento === "VENTA" || tipoMovimiento === "DIRECTA_CLIENTE") {
    const [{ data: product }, priceMap, dolar] = await Promise.all([
      supabase.from("products").select("name, kg_por_bolsa, comision_pct").eq("id", productId).single(),
      getPriceMap(),
      getDolarOficial(),
    ]);

    if (!product) return { error: "Producto inválido." };

    const precioUsd = priceMap[`${productId}_BOLSA_${sucursal.zona_id}`];
    if (precioUsd === null || precioUsd === undefined) {
      return {
        error: `Falta cargar el precio de ${product.name} para la zona de tu sucursal. Avisale a BTM para que lo cargue en Productos y precios.`,
      };
    }
    if (dolar.venta === null) {
      return { error: "No se pudo obtener la cotización del dólar. Probá de nuevo en unos minutos." };
    }

    const toneladas = (cantidadBolsas * product.kg_por_bolsa) / 1000;
    const montoArs = toneladas * precioUsd * dolar.venta * IVA;

    insert.precio_usd = precioUsd;
    insert.tipo_cambio = dolar.venta;
    insert.monto_ars = montoArs;

    if (tipoMovimiento === "DIRECTA_CLIENTE" && product.comision_pct !== null) {
      insert.comision_pct = product.comision_pct;
      insert.comision_ars = montoArs * (product.comision_pct / 100);
    }
  }

  const { error } = await supabase.from("sucursal_movimientos").insert(insert);
  if (error) return { error: `No se pudo guardar el movimiento: ${error.message}` };

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
