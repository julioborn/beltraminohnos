import { createClient } from "@/lib/supabase/server";
import type { Coords } from "./distance";

function normalize(s: string) {
  return s.trim().toUpperCase().replace(/\s+/g, " ");
}

export async function resolveLocality(provincia: string | null, localidad: string | null): Promise<Coords | null> {
  if (!provincia || !localidad) return null;
  const provincia_norm = normalize(provincia);
  const localidad_norm = normalize(localidad);

  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("locality_coords")
    .select("lat, lng")
    .eq("provincia_norm", provincia_norm)
    .eq("localidad_norm", localidad_norm)
    .maybeSingle();
  if (cached) return cached;

  try {
    const provRes = await fetch(
      `https://apis.datos.gob.ar/georef/api/provincias?nombre=${encodeURIComponent(provincia)}&campos=id&max=1`,
    );
    if (!provRes.ok) return null;
    const provinciaId = (await provRes.json()).provincias?.[0]?.id;
    if (!provinciaId) return null;

    const locRes = await fetch(
      `https://apis.datos.gob.ar/georef/api/localidades?provincia=${provinciaId}&nombre=${encodeURIComponent(localidad)}&campos=centroide&max=1`,
    );
    if (!locRes.ok) return null;
    const centroide = (await locRes.json()).localidades?.[0]?.centroide;
    if (!centroide) return null;

    const coords: Coords = { lat: centroide.lat, lng: centroide.lon };
    await supabase.from("locality_coords").upsert(
      { provincia_norm, localidad_norm, lat: coords.lat, lng: coords.lng },
      { onConflict: "provincia_norm,localidad_norm" },
    );
    return coords;
  } catch {
    return null;
  }
}
