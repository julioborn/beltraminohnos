import type { Database } from "@/lib/supabase/database.types";

export type PackagingType = Database["public"]["Enums"]["packaging_type"];

export const PACKAGING_TYPES: PackagingType[] = ["GRANEL", "BOLSA", "BIG_BAG"];

// Big Bag is priced the same as Granel — it has no price entries of its own.
export const PRICEABLE_PACKAGING_TYPES: PackagingType[] = ["GRANEL", "BOLSA"];

export const PACKAGING_LABELS: Record<PackagingType, string> = {
  GRANEL: "Granel",
  BOLSA: "Bolsa",
  BIG_BAG: "Big Bag",
};

// Which packaging type's prices apply when resolving a price for a given envase.
export function pricingPackagingType(tipoEnvase: PackagingType): PackagingType {
  return tipoEnvase === "BIG_BAG" ? "GRANEL" : tipoEnvase;
}
