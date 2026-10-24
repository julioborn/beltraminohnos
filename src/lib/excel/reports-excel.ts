import ExcelJS from "exceljs";
import {
  aggregateByCliente,
  aggregateByProducto,
  aggregateByVendedor,
  aggregateByZona,
  type AggregateRow,
  type ReportOrder,
} from "@/lib/reports/aggregate";
import { addBrandHeader } from "./brand-header";

const NAVY = "FF21305D";

function addAggregateSheet(workbook: ExcelJS.Workbook, name: string, nameColumn: string, rows: AggregateRow[]) {
  const sheet = workbook.addWorksheet(name);
  addBrandHeader(workbook, sheet);
  sheet.addRow([]);
  const headerRow = sheet.addRow([nameColumn, "Toneladas", "Total USD"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
  for (const row of rows) {
    sheet.addRow([row.label, row.toneladas, row.total]);
  }
  sheet.columns = [{ width: 32 }, { width: 14 }, { width: 16 }];
}

export async function buildReportsWorkbook(orders: ReportOrder[]) {
  const workbook = new ExcelJS.Workbook();

  addAggregateSheet(workbook, "Por cliente", "Cliente", aggregateByCliente(orders));
  addAggregateSheet(workbook, "Por vendedor", "Vendedor", aggregateByVendedor(orders));
  addAggregateSheet(workbook, "Por zona", "Zona", aggregateByZona(orders));
  addAggregateSheet(workbook, "Por producto", "Producto", aggregateByProducto(orders));

  return workbook;
}
