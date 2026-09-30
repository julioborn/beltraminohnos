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

  // Todo en una sola hoja: el detalle por cliente va debajo de la matriz,
  // no en una pestaña aparte.
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow(["Detalle por cliente"]).font = { bold: true, size: 12, color: { argb: "FF21305D" } };
  sheet.addRow([]);

  const detailHeaderRow = sheet.addRow([
    "Producto",
    "Total producto",
    "Nota de Pedido",
    "Cliente",
    "Fecha de entrega",
    "Toneladas",
  ]);
  detailHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  // Agrupado por producto: el nombre y el total del producto se muestran
  // una sola vez (celda combinada verticalmente), no repetidos en cada
  // nota, para poder identificar cada producto y su total de un vistazo.
  let groupStartRow = detailHeaderRow.number + 1;
  let groupProduct: string | null = null;

  function closeGroup(lastRowNumber: number) {
    if (groupProduct !== null && lastRowNumber > groupStartRow) {
      sheet.mergeCells(groupStartRow, 1, lastRowNumber, 1);
      sheet.mergeCells(groupStartRow, 2, lastRowNumber, 2);
      sheet.getCell(groupStartRow, 1).alignment = { vertical: "middle" };
      sheet.getCell(groupStartRow, 2).alignment = { vertical: "middle" };
    }
  }

  for (const d of detail) {
    const isNewGroup = d.productName !== groupProduct;
    if (isNewGroup) {
      closeGroup(sheet.lastRow!.number);
      groupStartRow = (sheet.lastRow?.number ?? detailHeaderRow.number) + 1;
      groupProduct = d.productName;
    }

    const row = sheet.addRow([
      isNewGroup ? d.productName : null,
      isNewGroup ? d.productTotal : null,
      d.numero,
      d.cliente,
      d.fechaEntrega ? formatFecha(d.fechaEntrega) : "—",
      d.cantidad,
    ]);
    row.getCell(1).font = { bold: true, color: { argb: "FF21305D" } };
    row.getCell(2).font = { bold: true, color: { argb: "FF21305D" } };
    row.getCell(4).alignment = { wrapText: true, vertical: "top" };
    if (isNewGroup) {
      row.eachCell((cell) => {
        cell.border = { top: { style: "thin", color: { argb: "FFCBD0DC" } } };
      });
    }
  }
  closeGroup(sheet.lastRow?.number ?? detailHeaderRow.number);

  sheet.autoFilter = {
    from: { row: detailHeaderRow.number, column: 1 },
    to: { row: detailHeaderRow.number + detail.length, column: 6 },
  };

  sheet.columns = [{ width: 30 }, ...matrix.days.map(() => ({ width: 13 })), { width: 14 }];
  // La columna "Cliente" del detalle cae en un índice que, en la matriz de
  // arriba, es una columna de día (angosta) — se ensancha aparte para que
  // los nombres largos no queden apretados.
  sheet.getColumn(4).width = 28;

  return workbook;
}
