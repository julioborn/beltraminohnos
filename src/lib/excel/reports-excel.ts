import ExcelJS from "exceljs";
import {
  aggregateByCliente,
  aggregateByProducto,
  aggregateByVendedor,
  aggregateByZona,
  type ReportOrder,
} from "@/lib/reports/aggregate";
import { addBrandHeader } from "./brand-header";

const NAVY = "FF21305D";

function addAggregateSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  nameColumn: string,
  rows: { label: string; count: number; total: number }[],
) {
  const sheet = workbook.addWorksheet(name);
  addBrandHeader(workbook, sheet);
  sheet.addRow([]);
  const headerRow = sheet.addRow([nameColumn, "Notas", "Total USD"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
  for (const row of rows) {
    sheet.addRow([row.label, row.count, row.total]);
  }
  sheet.columns = [{ width: 32 }, { width: 12 }, { width: 16 }];
}

export async function buildReportsWorkbook(orders: ReportOrder[]) {
  const workbook = new ExcelJS.Workbook();

  addAggregateSheet(workbook, "Por cliente", "Cliente", aggregateByCliente(orders));
  addAggregateSheet(workbook, "Por vendedor", "Vendedor", aggregateByVendedor(orders));
  addAggregateSheet(workbook, "Por zona", "Zona", aggregateByZona(orders));

  const productoSheet = workbook.addWorksheet("Por producto");
  addBrandHeader(workbook, productoSheet);
  productoSheet.addRow([]);
  const productoHeader = productoSheet.addRow(["Producto", "Cantidad", "Total USD"]);
  productoHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
  for (const row of aggregateByProducto(orders)) {
    productoSheet.addRow([row.label, row.cantidad, row.total]);
  }
  productoSheet.columns = [{ width: 32 }, { width: 12 }, { width: 16 }];

  return workbook;
}
