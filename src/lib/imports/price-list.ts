import type ExcelJS from "exceljs";
import type { PackagingType } from "@/lib/packaging";

// El Excel de la lista vigente viene en USD/kg (ej. "$ 0,313"); el sistema
// guarda el precio en USD/tonelada — confirmado comparando contra precios
// ya cargados (0,313 en el Excel === 313 en la base).
const EXCEL_PRICE_SCALE = 1000;

// La Hoja 1 del Excel usa un nombre distinto al del sistema para algún
// producto puntual (ej. "SUPLEMENTO MINERAL" ahí vs "SAL MINERAL" en el
// sistema y en la Hoja 2 de Chaco) — confirmado porque el precio ya cargado
// coincide exacto con el de esa fila. Mapear acá evita que quede sin
// actualizar mes a mes por esta inconsistencia del archivo de origen.
const PRODUCT_NAME_ALIASES: Record<string, string> = {
  "SUPLEMENTO MINERAL": "SAL MINERAL",
};

export type PriceImportChange = {
  productId: string;
  productName: string;
  zoneId: string;
  zoneName: string;
  packagingType: PackagingType;
  oldPrice: number | null;
  newPrice: number;
  changed: boolean;
};

export type PriceImportPreview = {
  changes: PriceImportChange[];
  unmatchedProducts: string[];
  unmatchedColumns: { sheet: string; header: string; reason: string }[];
};

function normalizeCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

function parsePriceCell(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return null;
  const normalized = cleaned.replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * EXCEL_PRICE_SCALE * 10000) / 10000;
}

export function parsePriceListWorkbook(
  workbook: ExcelJS.Workbook,
  products: { id: string; name: string }[],
  zones: { id: string; code: string; name: string }[],
  currentPrices: Record<string, number | null>,
): PriceImportPreview {
  const productByName = new Map(products.map((p) => [p.name.trim().toUpperCase(), p]));
  const zoneByCode = new Map(zones.map((z) => [normalizeCode(z.code), z]));

  const changes: PriceImportChange[] = [];
  const unmatchedProductsSet = new Set<string>();
  const unmatchedColumns: { sheet: string; header: string; reason: string }[] = [];

  for (const sheet of workbook.worksheets) {
    const headerRow = sheet.getRow(1);
    const columns: { col: number; packagingType: PackagingType; zoneId: string; zoneName: string }[] = [];

    for (let c = 2; c <= sheet.columnCount; c++) {
      const header = cellText(headerRow.getCell(c).value);
      if (!header) continue;

      // La mayoría de las hojas ponen el envase primero ("Granel Chaco"),
      // pero alguna (ej. Hoja 3 de la lista de noviembre) lo pone al final
      // separado por un punto ("Concep.Granel") — se acepta cualquiera de
      // los dos órdenes en vez de depender de que todas las hojas usen el
      // mismo formato de encabezado.
      const forward = header.match(/^(granel|bolsa)[\s.]+(.+)$/i);
      const reversed = header.match(/^(.+?)[\s.]+(granel|bolsa)$/i);
      const packagingLabel = forward?.[1] ?? reversed?.[2];
      const zoneLabel = forward?.[2] ?? reversed?.[1];

      if (!packagingLabel || !zoneLabel) {
        unmatchedColumns.push({ sheet: sheet.name, header, reason: "No tiene pinta de columna de precio (ni \"Granel/Bolsa <zona>\" ni \"<zona>.Granel/Bolsa\")." });
        continue;
      }

      const packagingType: PackagingType = packagingLabel.toUpperCase() === "GRANEL" ? "GRANEL" : "BOLSA";
      const zone = zoneByCode.get(normalizeCode(zoneLabel));
      if (!zone) {
        unmatchedColumns.push({ sheet: sheet.name, header, reason: `Zona "${zoneLabel}" no coincide con ninguna zona cargada en el sistema.` });
        continue;
      }

      columns.push({ col: c, packagingType, zoneId: zone.id, zoneName: zone.name });
    }

    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const productNameRaw = cellText(row.getCell(1).value);
      if (!productNameRaw) continue;

      const normalizedName = productNameRaw.toUpperCase();
      const product = productByName.get(PRODUCT_NAME_ALIASES[normalizedName] ?? normalizedName);
      if (!product) {
        unmatchedProductsSet.add(productNameRaw);
        continue;
      }

      for (const col of columns) {
        const raw = cellText(row.getCell(col.col).value);
        if (!raw) continue;
        const newPrice = parsePriceCell(raw);
        if (newPrice === null) continue;

        const key = `${product.id}_${col.packagingType}_${col.zoneId}`;
        const oldPrice = currentPrices[key] ?? null;

        changes.push({
          productId: product.id,
          productName: product.name,
          zoneId: col.zoneId,
          zoneName: col.zoneName,
          packagingType: col.packagingType,
          oldPrice,
          newPrice,
          changed: oldPrice === null || Math.abs(oldPrice - newPrice) > 0.0005,
        });
      }
    }
  }

  return {
    changes,
    unmatchedProducts: Array.from(unmatchedProductsSet).sort(),
    unmatchedColumns,
  };
}
