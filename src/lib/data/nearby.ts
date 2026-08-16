import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { resolveLocality } from "@/lib/geo/resolve-locality";
import { haversineKm } from "@/lib/geo/distance";
import { LIST_SELECT_BASE } from "./orders";

type LogisticaEstado = Database["public"]["Enums"]["logistica_status"];

export type NearbyFilters = {
  provincia?: string;
  localidad?: string;
  radio?: string;
  estado_logistica?: string;
};

const DEFAULT_RADIO_KM = 100;

function pairKey(provincia: string, localidad: string) {
  return `${provincia}␟${localidad}`;
}

export async function getOrderNotesNearby(filters: NearbyFilters) {
  const radioKm = Number(filters.radio) || DEFAULT_RADIO_KM;

  if (!filters.provincia || !filters.localidad) {
    return { center: null, results: [], excludedCount: 0, radioKm };
  }

  const center = await resolveLocality(filters.provincia, filters.localidad);
  if (!center) {
    return { center: null, results: [], excludedCount: 0, radioKm };
  }

  const supabase = await createClient();
  let query = supabase
    .from("order_notes")
    .select(`${LIST_SELECT_BASE}, items:order_items(id, cantidad, tipo_envase, precio_unitario, product:products(name))`)
    .order("fecha", { ascending: false });

  if (filters.estado_logistica) {
    query = query.eq("estado_logistica", filters.estado_logistica as LogisticaEstado);
  }

  const { data } = await query.limit(2000);
  const notes = data ?? [];

  const uniquePairs = new Map<string, { provincia: string; localidad: string }>();
  for (const n of notes) {
    if (n.provincia && n.localidad) {
      uniquePairs.set(pairKey(n.provincia, n.localidad), { provincia: n.provincia, localidad: n.localidad });
    }
  }

  const coordsByPair = new Map<string, Awaited<ReturnType<typeof resolveLocality>>>();
  for (const [key, { provincia, localidad }] of uniquePairs) {
    coordsByPair.set(key, await resolveLocality(provincia, localidad));
  }

  let excludedCount = 0;
  const withDistance: Array<(typeof notes)[number] & { distancia_km: number }> = [];

  for (const n of notes) {
    const coords = n.provincia && n.localidad ? coordsByPair.get(pairKey(n.provincia, n.localidad)) : null;
    if (!coords) {
      excludedCount++;
      continue;
    }
    const distancia_km = haversineKm(center, coords);
    if (distancia_km <= radioKm) {
      withDistance.push({ ...n, distancia_km });
    }
  }

  withDistance.sort((a, b) => a.distancia_km - b.distancia_km);

  return { center, results: withDistance, excludedCount, radioKm };
}
