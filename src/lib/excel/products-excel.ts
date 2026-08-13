import ExcelJS from "exceljs";
import { PRICEABLE_PACKAGING_TYPES, PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { addBrandHeader } from "./brand-header";

const NAVY = "FF21305D";

type Product = { id: string; name: string; active: boolean };
type Zone = { id: string; name: string };
type PriceRow = { product_id: string; packaging_type: PackagingType; zone_id: string; price_usd: number | null };

const TAB_LABELS: Partial<Record<PackagingType, string>> = {
  GRANEL: "Granel y Big Bag",
};

export async function buildProductsWorkbook(products: Product[], zones: Zone[], prices: PriceRow[]) {
  const workbook = new ExcelJS.Workbook();

  const priceByKey = new Map<string, number | null>();
  for (const p of prices) {
    priceByKey.set(`${p.product_id}_${p.packaging_type}_${p.zone_id}`, p.price_usd);
  }

  for (const tipo of PRICEABLE_PACKAGING_TYPES) {
    const sheet = workbook.addWorksheet(TAB_LABELS[tipo] ?? PACKAGING_LABELS[tipo]);
    addBrandHeader(workbook, sheet);
    sheet.addRow([]);

    const headerRow = sheet.addRow(["Producto", "Estado", ...zones.map((z) => z.name)]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    });

    for (const product of products) {
      const row = [
        product.name,
        product.active ? "Activo" : "Inactivo",
        ...zones.map((z) => {
          const price = priceByKey.get(`${product.id}_${tipo}_${z.id}`);
          return price ?? null;
        }),
      ];
      sheet.addRow(row);
    }

    sheet.columns = [{ width: 30 }, { width: 12 }, ...zones.map(() => ({ width: 14 }))];
  }

  return workbook;
}
