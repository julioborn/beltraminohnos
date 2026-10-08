"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ParadaTipo = Database["public"]["Enums"]["parada_tipo"];
type EstadoConosSilos = Database["public"]["Enums"]["estado_conos_silos"];
type EstadoLimpieza = Database["public"]["Enums"]["estado_limpieza"];
type PackagingType = Database["public"]["Enums"]["packaging_type"];

const PARADA_TIPOS: ParadaTipo[] = ["ROTURA", "CORTE_LUZ", "FALTA_MATERIA_PRIMA", "OTROS"];
const ESTADOS_CONOS_SILOS: EstadoConosSilos[] = ["BIEN", "GOLPEADOS"];
const ESTADOS_LIMPIEZA: EstadoLimpieza[] = ["B", "R", "M"];
const TIPOS_ENVASE: PackagingType[] = ["GRANEL", "BOLSA", "BIG_BAG"];

type ParsedEmpleado = { nombre: string; hora_ingreso: string | null; hora_salida: string | null; firma_confirmada: boolean };
type ParsedParada = { tipo: ParadaTipo; detalle: string | null; minutos: number | null };
type ParsedReemplazo = { reemplazo: string | null; motivo: string | null; autorizo: string | null };
type ParsedProduccion = {
  formula_id: string | null;
  kg_objetivo: number | null;
  tipo_envase: PackagingType | null;
  partida: string | null;
  tipo_alimento: string | null;
  ciclos_completados: number;
  kg_producido_real: number | null;
  granel_kg: number | null;
  bolsas_cantidad: number | null;
  rotulo_bolsas: string | null;
  stock_granel_kg: number | null;
  stock_bolsas_cantidad: number | null;
  reemplazos: ParsedReemplazo[];
};

function parseJsonArray(formData: FormData, key: string): Record<string, unknown>[] {
  try {
    const raw = JSON.parse(String(formData.get(key) ?? "[]"));
    return Array.isArray(raw) ? raw.filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null) : [];
  } catch {
    return [];
  }
}

function str(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type CrearTurnoState = { error: string } | undefined;

export async function crearTurno(_prevState: CrearTurnoState, formData: FormData): Promise<CrearTurnoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // La PC de fábrica usa una sola cuenta compartida — el operador real se
  // elige de la lista en el formulario, nunca se infiere del login.
  const operadorId = str(formData.get("operador_id"));
  if (!operadorId) return { error: "Seleccioná quién realizó el turno." };

  const { data: operador } = await supabase
    .from("operadores_fabrica")
    .select("id")
    .eq("id", operadorId)
    .eq("active", true)
    .maybeSingle();
  if (!operador) return { error: "El operador seleccionado no es válido." };

  const fecha = String(formData.get("fecha") ?? "") || new Date().toISOString().slice(0, 10);
  const horaIngreso = str(formData.get("hora_ingreso"));
  const horaSalida = str(formData.get("hora_salida"));
  const firmaConfirmada = formData.get("firma_confirmada") === "on";

  const estadoConosSilosRaw = str(formData.get("estado_conos_silos"));
  const estadoConosSilos = ESTADOS_CONOS_SILOS.includes(estadoConosSilosRaw as EstadoConosSilos)
    ? (estadoConosSilosRaw as EstadoConosSilos)
    : null;

  const estadoLimpiezaRaw = str(formData.get("estado_limpieza"));
  const estadoLimpieza = ESTADOS_LIMPIEZA.includes(estadoLimpiezaRaw as EstadoLimpieza)
    ? (estadoLimpiezaRaw as EstadoLimpieza)
    : null;

  const operadorAnterior = str(formData.get("operador_anterior"));
  const engraseRoloHs = str(formData.get("engrase_rolo_hs"));
  const engraseEjePrensaHs = str(formData.get("engrase_eje_prensa_hs"));
  const observaciones = str(formData.get("observaciones"));

  const empleados: ParsedEmpleado[] = parseJsonArray(formData, "empleados")
    .map((e) => ({
      nombre: String(e.nombre ?? "").trim(),
      hora_ingreso: str(e.hora_ingreso),
      hora_salida: str(e.hora_salida),
      firma_confirmada: Boolean(e.firma_confirmada),
    }))
    .filter((e) => e.nombre);

  const paradas: ParsedParada[] = parseJsonArray(formData, "paradas")
    .map((p) => ({
      tipo: PARADA_TIPOS.includes(p.tipo as ParadaTipo) ? (p.tipo as ParadaTipo) : null,
      detalle: str(p.detalle),
      minutos: num(p.minutos),
    }))
    .filter((p): p is ParsedParada => p.tipo !== null);

  const producciones: ParsedProduccion[] = parseJsonArray(formData, "producciones")
    .map((p) => ({
      formula_id: str(p.formula_id),
      kg_objetivo: num(p.kg_objetivo),
      tipo_envase: TIPOS_ENVASE.includes(p.tipo_envase as PackagingType) ? (p.tipo_envase as PackagingType) : null,
      partida: str(p.partida),
      tipo_alimento: str(p.tipo_alimento),
      ciclos_completados: num(p.ciclos_completados) ?? 0,
      kg_producido_real: num(p.kg_producido_real),
      granel_kg: num(p.granel_kg),
      bolsas_cantidad: num(p.bolsas_cantidad),
      rotulo_bolsas: str(p.rotulo_bolsas),
      stock_granel_kg: num(p.stock_granel_kg),
      stock_bolsas_cantidad: num(p.stock_bolsas_cantidad),
      reemplazos: Array.isArray(p.reemplazos)
        ? (p.reemplazos as Record<string, unknown>[])
            .map((r) => ({ reemplazo: str(r.reemplazo), motivo: str(r.motivo), autorizo: str(r.autorizo) }))
            .filter((r) => r.reemplazo || r.motivo || r.autorizo)
        : [],
    }))
    .filter((p) => p.formula_id);

  if (producciones.length === 0) {
    return { error: "Agregá al menos un producto elaborado en el turno." };
  }

  const { data: turno, error: turnoError } = await supabase
    .from("turnos")
    .insert({
      fecha,
      operador_id: operadorId,
      hora_ingreso: horaIngreso,
      hora_salida: horaSalida,
      firma_confirmada: firmaConfirmada,
      estado_conos_silos: estadoConosSilos,
      estado_limpieza: estadoLimpieza,
      operador_anterior: operadorAnterior,
      engrase_rolo_hs: engraseRoloHs,
      engrase_eje_prensa_hs: engraseEjePrensaHs,
      observaciones,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (turnoError || !turno) {
    return { error: `No se pudo crear el turno: ${turnoError?.message ?? "error desconocido"}` };
  }

  if (empleados.length > 0) {
    const { error } = await supabase.from("turno_empleados").insert(
      empleados.map((e) => ({ turno_id: turno.id, ...e })),
    );
    if (error) return { error: `No se pudieron guardar los empleados: ${error.message}` };
  }

  if (paradas.length > 0) {
    const { error } = await supabase.from("turno_paradas").insert(
      paradas.map((p) => ({ turno_id: turno.id, ...p })),
    );
    if (error) return { error: `No se pudieron guardar las paradas: ${error.message}` };
  }

  for (const p of producciones) {
    const { reemplazos, ...produccionFields } = p;
    const { data: produccion, error: produccionError } = await supabase
      .from("producciones")
      .insert({ turno_id: turno.id, created_by: user.id, ...produccionFields })
      .select("id")
      .single();

    if (produccionError || !produccion) {
      return { error: `No se pudo guardar un producto del turno: ${produccionError?.message ?? "error desconocido"}` };
    }

    if (reemplazos.length > 0) {
      const { error } = await supabase.from("produccion_reemplazos").insert(
        reemplazos.map((r) => ({ produccion_id: produccion.id, ...r })),
      );
      if (error) return { error: `No se pudieron guardar los reemplazos: ${error.message}` };
    }
  }

  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  return undefined;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export type ActualizarCiclosState = { error: string } | undefined;

// Un turno solo se puede seguir cargando el mismo día — una vez que pasa la
// fecha queda cerrado, para no reabrir producción de días anteriores.
export async function actualizarCiclosProduccion(
  _prevState: ActualizarCiclosState,
  formData: FormData,
): Promise<ActualizarCiclosState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const produccionId = str(formData.get("produccion_id"));
  if (!produccionId) return { error: "Producción inválida." };

  const ciclos = num(formData.get("ciclos_completados")) ?? 0;

  const { data: produccion } = await supabase
    .from("producciones")
    .select("id, turno:turnos(fecha)")
    .eq("id", produccionId)
    .maybeSingle();
  if (!produccion) return { error: "La producción no existe." };
  if (produccion.turno?.fecha !== hoyISO()) {
    return { error: "Ese turno ya no es de hoy, no se puede editar." };
  }

  const { error } = await supabase
    .from("producciones")
    .update({ ciclos_completados: ciclos, kg_producido_real: ciclos > 0 ? ciclos * 1000 : null })
    .eq("id", produccionId);
  if (error) return { error: `No se pudo actualizar: ${error.message}` };

  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  return undefined;
}

export type AgregarProduccionState = { error: string } | undefined;

export async function agregarProduccionATurno(
  _prevState: AgregarProduccionState,
  formData: FormData,
): Promise<AgregarProduccionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) return { error: "Turno inválido." };

  const { data: turno } = await supabase.from("turnos").select("id, fecha").eq("id", turnoId).maybeSingle();
  if (!turno) return { error: "El turno no existe." };
  if (turno.fecha !== hoyISO()) {
    return { error: "Ese turno ya no es de hoy, no se puede editar." };
  }

  const formulaId = str(formData.get("formula_id"));
  if (!formulaId) return { error: "Seleccioná la fórmula." };

  const tipoEnvaseRaw = str(formData.get("tipo_envase"));
  const ciclosCompletados = num(formData.get("ciclos_completados")) ?? 0;

  const { data: produccion, error: produccionError } = await supabase
    .from("producciones")
    .insert({
      turno_id: turnoId,
      formula_id: formulaId,
      kg_objetivo: num(formData.get("kg_objetivo")),
      tipo_envase: TIPOS_ENVASE.includes(tipoEnvaseRaw as PackagingType) ? (tipoEnvaseRaw as PackagingType) : null,
      ciclos_completados: ciclosCompletados,
      kg_producido_real: ciclosCompletados > 0 ? ciclosCompletados * 1000 : null,
      granel_kg: num(formData.get("granel_kg")),
      bolsas_cantidad: num(formData.get("bolsas_cantidad")),
      rotulo_bolsas: str(formData.get("rotulo_bolsas")),
      stock_granel_kg: num(formData.get("stock_granel_kg")),
      stock_bolsas_cantidad: num(formData.get("stock_bolsas_cantidad")),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (produccionError || !produccion) {
    return { error: `No se pudo guardar el producto: ${produccionError?.message ?? "error desconocido"}` };
  }

  const reemplazos: ParsedReemplazo[] = parseJsonArray(formData, "reemplazos")
    .map((r) => ({ reemplazo: str(r.reemplazo), motivo: str(r.motivo), autorizo: str(r.autorizo) }))
    .filter((r) => r.reemplazo || r.motivo || r.autorizo);

  if (reemplazos.length > 0) {
    const { error } = await supabase.from("produccion_reemplazos").insert(
      reemplazos.map((r) => ({ produccion_id: produccion.id, ...r })),
    );
    if (error) return { error: `No se pudieron guardar los reemplazos: ${error.message}` };
  }

  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  return undefined;
}
