"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewProduccion } from "@/lib/auth/role";
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
type ParsedReemplazo = { reemplazo: string | null; motivo: string | null; autorizo: string | null };

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

  const empleados: ParsedEmpleado[] = parseJsonArray(formData, "empleados")
    .map((e) => ({
      nombre: String(e.nombre ?? "").trim(),
      hora_ingreso: str(e.hora_ingreso),
      hora_salida: str(e.hora_salida),
      firma_confirmada: Boolean(e.firma_confirmada),
    }))
    .filter((e) => e.nombre);

  const { data: turno, error: turnoError } = await supabase
    .from("turnos")
    .insert({
      fecha,
      operador_id: operadorId,
      hora_ingreso: horaIngreso,
      hora_salida: horaSalida,
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

  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  redirect(`/produccion/cargar/${turno.id}`);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// Paradas, estado de planta y observaciones se cargan sobre un turno ya
// creado — no se sabe nada de esto al abrir el turno. Mismo criterio de
// "editable" que productos: mismo día y sin finalizar.
async function turnoEditableError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  turnoId: string,
): Promise<string | null> {
  const { data: turno } = await supabase.from("turnos").select("id, fecha, finalizado").eq("id", turnoId).maybeSingle();
  if (!turno) return "El turno no existe.";
  if (turno.finalizado) return "Este turno ya fue finalizado, no se puede editar.";
  if (turno.fecha !== hoyISO()) return "Ese turno ya no es de hoy, no se puede editar.";
  return null;
}

function revalidateTurnoPaths(turnoId: string) {
  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  revalidatePath(`/produccion/cargar/${turnoId}`);
  revalidatePath(`/produccion/${turnoId}`);
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
    .select("id, turno:turnos(fecha, finalizado)")
    .eq("id", produccionId)
    .maybeSingle();
  if (!produccion) return { error: "La producción no existe." };
  if (produccion.turno?.finalizado) {
    return { error: "Este turno ya fue finalizado, no se puede editar." };
  }
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

  const { data: turno } = await supabase.from("turnos").select("id, fecha, finalizado").eq("id", turnoId).maybeSingle();
  if (!turno) return { error: "El turno no existe." };
  if (turno.finalizado) {
    return { error: "Este turno ya fue finalizado, no se puede editar." };
  }
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

export type AgregarParadaState = { error: string } | undefined;

export async function agregarParada(_prevState: AgregarParadaState, formData: FormData): Promise<AgregarParadaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) return { error: "Turno inválido." };

  const editableError = await turnoEditableError(supabase, turnoId);
  if (editableError) return { error: editableError };

  const tipoRaw = str(formData.get("tipo"));
  const tipo = PARADA_TIPOS.includes(tipoRaw as ParadaTipo) ? (tipoRaw as ParadaTipo) : null;
  if (!tipo) return { error: "Seleccioná el tipo de parada." };

  const { error } = await supabase.from("turno_paradas").insert({
    turno_id: turnoId,
    tipo,
    detalle: str(formData.get("detalle")),
    minutos: num(formData.get("minutos")),
  });
  if (error) return { error: `No se pudo guardar la parada: ${error.message}` };

  revalidateTurnoPaths(turnoId);
  return undefined;
}

export async function eliminarParada(formData: FormData) {
  const paradaId = str(formData.get("parada_id"));
  if (!paradaId) throw new Error("Parada inválida.");

  const supabase = await createClient();
  const { data: parada } = await supabase
    .from("turno_paradas")
    .select("id, turno_id")
    .eq("id", paradaId)
    .maybeSingle();
  if (!parada) throw new Error("La parada no existe.");
  const editableError = await turnoEditableError(supabase, parada.turno_id);
  if (editableError) throw new Error(editableError);

  const { error } = await supabase.from("turno_paradas").delete().eq("id", paradaId);
  if (error) throw new Error(`No se pudo borrar la parada: ${error.message}`);

  revalidateTurnoPaths(parada.turno_id);
}

export type ActualizarEstadoPlantaState = { error: string } | undefined;

export async function actualizarEstadoPlanta(
  _prevState: ActualizarEstadoPlantaState,
  formData: FormData,
): Promise<ActualizarEstadoPlantaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) return { error: "Turno inválido." };

  const editableError = await turnoEditableError(supabase, turnoId);
  if (editableError) return { error: editableError };

  const estadoConosSilosRaw = str(formData.get("estado_conos_silos"));
  const estadoConosSilos = ESTADOS_CONOS_SILOS.includes(estadoConosSilosRaw as EstadoConosSilos)
    ? (estadoConosSilosRaw as EstadoConosSilos)
    : null;

  const estadoLimpiezaRaw = str(formData.get("estado_limpieza"));
  const estadoLimpieza = ESTADOS_LIMPIEZA.includes(estadoLimpiezaRaw as EstadoLimpieza)
    ? (estadoLimpiezaRaw as EstadoLimpieza)
    : null;

  const { error } = await supabase
    .from("turnos")
    .update({
      estado_conos_silos: estadoConosSilos,
      estado_limpieza: estadoLimpieza,
      operador_anterior: str(formData.get("operador_anterior")),
      engrase_rolo_hs: str(formData.get("engrase_rolo_hs")),
      engrase_eje_prensa_hs: str(formData.get("engrase_eje_prensa_hs")),
    })
    .eq("id", turnoId);
  if (error) return { error: `No se pudo guardar el estado de planta: ${error.message}` };

  revalidateTurnoPaths(turnoId);
  return undefined;
}

export async function quitarEstadoPlanta(formData: FormData) {
  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) throw new Error("Turno inválido.");

  const supabase = await createClient();
  const editableError = await turnoEditableError(supabase, turnoId);
  if (editableError) throw new Error(editableError);

  const { error } = await supabase
    .from("turnos")
    .update({
      estado_conos_silos: null,
      estado_limpieza: null,
      operador_anterior: null,
      engrase_rolo_hs: null,
      engrase_eje_prensa_hs: null,
    })
    .eq("id", turnoId);
  if (error) throw new Error(`No se pudo borrar el estado de planta: ${error.message}`);

  revalidateTurnoPaths(turnoId);
}

export type ActualizarObservacionesState = { error: string } | undefined;

export async function actualizarObservaciones(
  _prevState: ActualizarObservacionesState,
  formData: FormData,
): Promise<ActualizarObservacionesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) return { error: "Turno inválido." };

  const editableError = await turnoEditableError(supabase, turnoId);
  if (editableError) return { error: editableError };

  const { error } = await supabase
    .from("turnos")
    .update({ observaciones: str(formData.get("observaciones")) })
    .eq("id", turnoId);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidateTurnoPaths(turnoId);
  return undefined;
}

export async function quitarObservaciones(formData: FormData) {
  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) throw new Error("Turno inválido.");

  const supabase = await createClient();
  const editableError = await turnoEditableError(supabase, turnoId);
  if (editableError) throw new Error(editableError);

  const { error } = await supabase.from("turnos").update({ observaciones: null }).eq("id", turnoId);
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);

  revalidateTurnoPaths(turnoId);
}

// El dueño quiere que el operador cierre el turno a mano cuando termina
// (un turno real no siempre coincide con el corte de medianoche que usa el
// chequeo de fecha): una vez finalizado, queda bloqueado para siempre.
export async function finalizarTurno(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) throw new Error("Turno inválido.");

  const { error } = await supabase.from("turnos").update({ finalizado: true }).eq("id", turnoId);
  if (error) throw new Error(`No se pudo finalizar el turno: ${error.message}`);

  revalidateTurnoPaths(turnoId);
}

// Borra el turno completo (empleados, paradas, producciones y sus
// reemplazos caen en cascada). Mismo criterio de acceso que ver el panel de
// Producción — no se restringe más.
export async function eliminarTurno(formData: FormData) {
  if (!(await canViewProduccion())) {
    throw new Error("No autorizado.");
  }

  const turnoId = str(formData.get("turno_id"));
  if (!turnoId) throw new Error("Turno inválido.");

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").delete().eq("id", turnoId);
  if (error) throw new Error(`No se pudo borrar el turno: ${error.message}`);

  revalidatePath("/produccion");
  revalidatePath("/produccion/cargar");
  redirect("/produccion");
}
