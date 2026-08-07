import type { Database } from "@/lib/supabase/database.types";

export type PackagingType = Database["public"]["Enums"]["packaging_type"];

export const PACKAGING_TYPES: PackagingType[] = ["GRANEL", "BOLSA", "BIG_BAG"];

export const PACKAGING_LABELS: Record<PackagingType, string> = {
  GRANEL: "Granel",
  BOLSA: "Bolsa",
  BIG_BAG: "Big Bag",
};
