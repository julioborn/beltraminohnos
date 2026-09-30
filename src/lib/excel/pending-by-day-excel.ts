import ExcelJS from "exceljs";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { PendingDayMatrix, PendingDayMode, PendingDetailRow } from "@/lib/reports/pending-by-day";

const NAVY = "FF21305D";
const NAVY_LIGHT = "FFEEF0F6";

export async function buildPendingByDayWorkbook(
  matrix: PendingDayMatrix,
  mode: PendingDayMode,
  start: string,
  end: string,
  detail: PendingDetailRow[],
) {
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

  const detailSheet = workbook.addWorksheet("Detalle por cliente");
  addBrandHeader(workbook, detailSheet);
  detailSheet.addRow([`${modeLabel} — ${formatDiaEntrega(start)} al ${formatDiaEntrega(end)}`]).font = { italic: true };
  detailSheet.addRow([]);

  const detailHeaderRow = detailSheet.addRow([
    "Producto",
    "Nota",
    "Cliente",
    "Fecha de entrega",
    "Toneladas",
    "Total producto",
  ]);
  detailHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  for (const d of detail) {
    detailSheet.addRow([
      d.productName,
      d.numero,
      d.cliente,
      d.fechaEntrega ? formatFecha(d.fechaEntrega) : "—",
      d.cantidad,
      d.productTotal,
    ]);
  }

  detailSheet.autoFilter = {
    from: { row: detailHeaderRow.number, column: 1 },
    to: { row: detailHeaderRow.number + detail.length, column: 6 },
  };
  detailSheet.columns = [{ width: 30 }, { width: 12 }, { width: 34 }, { width: 16 }, { width: 12 }, { width: 14 }];

  return workbook;
}
