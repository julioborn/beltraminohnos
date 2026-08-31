import ExcelJS from "exceljs";
import { formatDiaEntrega } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { PendingDayMatrix, PendingDayMode } from "@/lib/reports/pending-by-day";

const NAVY = "FF21305D";
const NAVY_LIGHT = "FFEEF0F6";

export async function buildPendingByDayWorkbook(matrix: PendingDayMatrix, mode: PendingDayMode, start: string, end: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pendientes por producto");

  addBrandHeader(workbook, sheet);
  const modeLabel = mode === "fabricacion" ? "Pendiente de fabricación" : "Pendiente de entrega";
  sheet.addRow([`${modeLabel} — ${formatDiaEntrega(start)} al ${formatDiaEntrega(end)}`]).font = { italic: true };
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Producto", ...matrix.days.map((d) => formatDiaEntrega(d) ?? d), "Total"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  for (const row of matrix.rows) {
    sheet.addRow([row.productName, ...matrix.days.map((d) => row.byDay[d] ?? 0), row.total]);
  }

  const totalRow = sheet.addRow(["Total", ...matrix.days.map((d) => matrix.totalByDay[d] ?? 0), matrix.grandTotal]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: NAVY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    cell.border = { top: { style: "medium", color: { argb: NAVY } } };
  });

  sheet.columns = [{ width: 30 }, ...matrix.days.map(() => ({ width: 11 })), { width: 12 }];

  return workbook;
}
