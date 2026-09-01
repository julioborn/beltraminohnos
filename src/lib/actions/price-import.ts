"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllProducts, getZones, getPriceMap } from "@/lib/data/master-data";
import { parsePriceListWorkbook, type PriceImportPreview, type PriceImportChange } from "@/lib/imports/price-list";

export type PriceImportState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "preview"; preview: PriceImportPreview };

export async function previewPriceImport(
  _prevState: PriceImportState,
  formData: FormData,
): Promise<PriceImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Elegí un archivo Excel." };
  }

  let workbook: ExcelJS.Workbook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
  } catch {
    return { status: "error", message: "No se pudo leer el archivo. ¿Es un Excel (.xlsx) válido?" };
  }

  const [products, zones, priceMap] = await Promise.all([getAllProducts(), getZones(), getPriceMap()]);
  const preview = parsePriceListWorkbook(workbook, products, zones, priceMap);

  if (preview.changes.length === 0) {
    return { status: "error", message: "No se encontraron precios para actualizar en este archivo." };
  }

  return { status: "preview", preview };
}

export async function applyPriceImport(changes: PriceImportChange[]) {
  const toApply = changes.filter((c) => c.changed);
  if (toApply.length === 0) return { error: undefined, updated: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("prices").upsert(
    toApply.map((c) => ({
      product_id: c.productId,
      packaging_type: c.packagingType,
      zone_id: c.zoneId,
      price_usd: c.newPrice,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })),
    { onConflict: "product_id,packaging_type,zone_id" },
  );

  revalidatePath("/productos");

  if (error) return { error: error.message, updated: 0 };
  return { error: undefined, updated: toApply.length };
}
