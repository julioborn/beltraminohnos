import path from "path";
import type ExcelJS from "exceljs";

const ICON_PATH = path.join(process.cwd(), "public/brand/btm-icon-mark-white.png");

export function addBrandHeader(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet) {
  const iconId = workbook.addImage({ filename: ICON_PATH, extension: "png" });
  const row = sheet.addRow(["", "BTM · Nutrición Animal"]);
  row.height = 24;
  row.getCell(2).font = { bold: true, size: 13, color: { argb: "FF21305D" } };
  sheet.addImage(iconId, {
    tl: { col: 0.15, row: row.number - 1 + 0.12 },
    ext: { width: 18, height: 18 },
  });
}
