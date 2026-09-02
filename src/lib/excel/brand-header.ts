import path from "path";
import type ExcelJS from "exceljs";

const ICON_PATH = path.join(process.cwd(), "public/brand/btm-icon-mark-white.png");

export function addBrandHeader(workbook: ExcelJS.Workbook, sheet: ExcelJS.Worksheet) {
  const iconId = workbook.addImage({ filename: ICON_PATH, extension: "png" });
  const row = sheet.addRow(["", "BTM · Nutrición Animal"]);
  row.height = 24;
  row.getCell(2).font = { bold: true, size: 13, color: { argb: "FF21305D" } };
  // Combina celdas para que el texto tenga lugar garantizado y no dependa del
  // "desborde" a la celda vecina, que varía entre Excel de escritorio, mobile
  // y otros lectores (algunos lo cortan siempre al ancho de una sola celda).
  sheet.mergeCells(row.number, 2, row.number, 5);
  sheet.addImage(iconId, {
    tl: { col: 0.15, row: row.number - 1 + 0.12 },
    ext: { width: 18, height: 18 },
  });
}
