import ExcelJS from "exceljs";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { RepartoDetail } from "@/lib/pdf/types";

const NAVY = "FF21305D";

export async function buildRepartoWorkbook({ reparto, notes }: RepartoDetail) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reparto");

  addBrandHeader(workbook, sheet);
  sheet.addRow([]);
  sheet.addRow(["Nombre", reparto.nombre]);
  sheet.addRow(["Fecha", formatFecha(reparto.created_at.slice(0, 10))]);
  sheet.addRow(["Chofer", reparto.chofer?.name ?? ""]);
  sheet.addRow([
    "Flota",
    reparto.camiones.map((c) => c.camion?.dominio).filter(Boolean).join(", "),
  ]);
  if (reparto.descripcion) sheet.addRow(["Descripción", reparto.descripcion]);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "N°",
    "Fecha",
    "Cliente",
    "Provincia",
    "Localidad",
    "Productos",
    "Vendedor",
    "Estado pedido",
    "Estado producción",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  for (const order of notes) {
    sheet.addRow([
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.provincia ?? "",
      order.localidad ?? "",
      order.items
        .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
        .join(", "),
      order.vendedor?.name ?? "",
      LOGISTICA_LABELS[order.estado_logistica],
      PRODUCCION_LABELS[order.estado_produccion],
    ]);
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 18 },
    { width: 50 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
  ];

  return workbook;
}
