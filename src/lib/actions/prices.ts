"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PackagingType } from "@/lib/packaging";

export async function updatePrice(
  productId: string,
  packagingType: PackagingType,
  zoneId: string,
  priceUsd: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("prices")
    .update({ price_usd: priceUsd, updated_at: new Date().toISOString(), updated_by: user?.id })
    .eq("product_id", productId)
    .eq("packaging_type", packagingType)
    .eq("zone_id", zoneId);

  revalidatePath("/precios");
  return { error: error?.message };
}
