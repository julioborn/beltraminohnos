import { createClient } from "@/lib/supabase/server";

export type ProduccionFilters = {
  desde?: string;
  hasta?: string;
  operador?: string;
};

export async function getFormulas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formulas")
    .select("id, codigo, nombre, set_total_kg")
    .eq("active", true)
    .order("nombre");
  return data ?? [];
}

const TURNO_SELECT = `id, numero, fecha, hora_ingreso, hora_salida, firma_confirmada,
  estado_conos_silos, estado_limpieza, operador_anterior, engrase_rolo_hs, engrase_eje_prensa_hs,
  observaciones, created_at,
  operador:profiles!turnos_operador_id_fkey(id, full_name),
  turno_empleados(id, nombre, hora_ingreso, hora_salida, firma_confirmada),
  turno_paradas(id, tipo, detalle, minutos),
  producciones(id, numero, kg_objetivo, kg_producido_real, tipo_envase, partida, tipo_alimento,
    ciclos_completados, granel_kg, bolsas_cantidad, rotulo_bolsas, stock_granel_kg, stock_bolsas_cantidad,
    formula:formulas(id, codigo, nombre, set_total_kg),
    produccion_reemplazos(id, reemplazo, motivo, autorizo))`;

export async function getTurnos(filters: ProduccionFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("turnos").select(TURNO_SELECT).order("fecha", { ascending: false });

  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);
  if (filters.operador) query = query.eq("operador_id", filters.operador);

  const { data } = await query.limit(200);
  return data ?? [];
}

export async function getTurnoDetalle(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("turnos").select(TURNO_SELECT).eq("id", id).maybeSingle();
  return data;
}

export async function getMisTurnos(operadorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turnos")
    .select(TURNO_SELECT)
    .eq("operador_id", operadorId)
    .order("fecha", { ascending: false })
    .limit(30);
  return data ?? [];
}

export type ConsumoInsumo = { producto: string; kgConsumidos: number };

// El consumo no se guarda: se calcula igual que el saldo de consignaciones —
// factor = kg_producido_real / set_total_kg de la fórmula, aplicado a cada
// ingrediente de esa fórmula. Por construcción, la suma de todos los insumos
// consumidos da exactamente el total de kg de producto terminado (la regla
// que pidió el dueño).
export async function getConsumoMateriaPrima(filters: Pick<ProduccionFilters, "desde" | "hasta"> = {}): Promise<{
  insumos: ConsumoInsumo[];
  totalKgProducido: number;
}> {
  const supabase = await createClient();

  let produccionesQuery = supabase
    .from("producciones")
    .select("kg_producido_real, formula_id, turno:turnos!inner(fecha)")
    .not("kg_producido_real", "is", null)
    .not("formula_id", "is", null);

  if (filters.desde) produccionesQuery = produccionesQuery.gte("turno.fecha", filters.desde);
  if (filters.hasta) produccionesQuery = produccionesQuery.lte("turno.fecha", filters.hasta);

  const { data: producciones } = await produccionesQuery;
  const rows = producciones ?? [];

  if (rows.length === 0) return { insumos: [], totalKgProducido: 0 };

  const formulaIds = Array.from(new Set(rows.map((r) => r.formula_id).filter((id): id is string => Boolean(id))));
  const { data: ingredientes } = await supabase
    .from("formula_ingredientes")
    .select("formula_id, producto, set_kg")
    .in("formula_id", formulaIds);

  const { data: formulas } = await supabase.from("formulas").select("id, set_total_kg").in("id", formulaIds);
  const setTotalByFormula = new Map((formulas ?? []).map((f) => [f.id, f.set_total_kg]));
  const ingredientesByFormula = new Map<string, { producto: string; set_kg: number }[]>();
  for (const ing of ingredientes ?? []) {
    const list = ingredientesByFormula.get(ing.formula_id) ?? [];
    list.push({ producto: ing.producto, set_kg: ing.set_kg });
    ingredientesByFormula.set(ing.formula_id, list);
  }

  const consumoMap = new Map<string, number>();
  let totalKgProducido = 0;

  for (const row of rows) {
    if (!row.formula_id || row.kg_producido_real == null) continue;
    const setTotal = setTotalByFormula.get(row.formula_id);
    if (!setTotal) continue;
    const factor = row.kg_producido_real / setTotal;
    totalKgProducido += row.kg_producido_real;

    for (const ing of ingredientesByFormula.get(row.formula_id) ?? []) {
      const consumo = factor * ing.set_kg;
      consumoMap.set(ing.producto, (consumoMap.get(ing.producto) ?? 0) + consumo);
    }
  }

  const insumos = Array.from(consumoMap.entries())
    .map(([producto, kgConsumidos]) => ({ producto, kgConsumidos }))
    .sort((a, b) => b.kgConsumidos - a.kgConsumidos);

  return { insumos, totalKgProducido };
}
