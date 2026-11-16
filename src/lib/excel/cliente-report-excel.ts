import ExcelJS from "exceljs";
import type { ClienteReportRow } from "@/lib/reports/cliente-report";
import { addBrandHeader } from "./brand-header";

const NAVY = "FF21305D";

export async function buildClienteReportWorkbook(
  rows: ClienteReportRow[],
  mode: "productos" | "clientes",
  titulo: string,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Informe por cliente");
  addBrandHeader(workbook, sheet);
  sheet.addRow([titulo]);
  sheet.addRow([]);

  const nameColumn = mode === "productos" ? "Producto" : "Cliente";
  const headerRow = sheet.addRow([
    nameColumn,
    "Entregado (tn)",
    "Entregado (USD)",
    "Pend. fabricar (tn)",
    "Pend. fabricar (USD)",
    "Pend. entregar (tn)",
    "Pend. entregar (USD)",
    "Total (tn)",
    "Total (USD)",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  for (const r of rows) {
    sheet.addRow([
      r.label,
      r.entregado.cantidad,
      r.entregado.monto,
      r.pendienteFabricar.cantidad,
      r.pendienteFabricar.monto,
      r.pendienteEntregar.cantidad,
      r.pendienteEntregar.monto,
      r.total.cantidad,
      r.total.monto,
    ]);
  }

  const totalRow = sheet.addRow([
    "Total",
    rows.reduce((s, r) => s + r.entregado.cantidad, 0),
    rows.reduce((s, r) => s + r.entregado.monto, 0),
    rows.reduce((s, r) => s + r.pendienteFabricar.cantidad, 0),
    rows.reduce((s, r) => s + r.pendienteFabricar.monto, 0),
    rows.reduce((s, r) => s + r.pendienteEntregar.cantidad, 0),
    rows.reduce((s, r) => s + r.pendienteEntregar.monto, 0),
    rows.reduce((s, r) => s + r.total.cantidad, 0),
    rows.reduce((s, r) => s + r.total.monto, 0),
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  sheet.columns = [
    { width: 32 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 14 },
  ];

  return workbook;
}
