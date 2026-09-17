import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "empleado";

export async function getProfileRole(): Promise<ProfileRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (profile?.role as ProfileRole | undefined) ?? null;
}

export function hasFullAccess(role: ProfileRole | null): boolean {
  return role === "admin";
}
