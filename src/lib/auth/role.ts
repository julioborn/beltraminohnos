import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "empleado" | "limitado" | "contable";

// auth.getUser() valida el JWT contra el servidor de Supabase (a diferencia
// de getSession(), que solo lee la cookie) — es la forma correcta de
// confiar en la identidad server-side, pero cuesta un viaje de red real.
// Layout, página y cualquier data-fetch de esa misma request lo piden por
// separado; cache() de React lo memoiza para que dentro de una request se
// pague ese costo una sola vez en vez de 3-4 veces en cascada.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getProfileRole(): Promise<ProfileRole | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (profile?.role as ProfileRole | undefined) ?? null;
}

export function hasFullAccess(role: ProfileRole | null): boolean {
  return role === "admin";
}
