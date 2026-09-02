import ExcelJS from "exceljs";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { OrderListItem } from "@/lib/pdf/types";

const NAVY = "FF21305D";
const NAVY_LIGHT = "FFEEF0F6";

function productTonnageByOrder(order: OrderListItem) {
  const map = new Map<string, number>();
  for (const it of order.items) {
    const name = it.product?.name ?? "—";
    map.set(name, (map.get(name) ?? 0) + it.cantidad);
  }
  return map;
}

export async function buildOrderListWorkbook(orders: OrderListItem[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Notas de pedido");

  // Agrupa visualmente por zona (y dentro de cada zona, por fecha) para que,
  // combinado con el AutoFilter de abajo, se pueda aislar una zona puntual.
  const sortedOrders = [...orders].sort((a, b) => {
    const zonaCompare = (a.zona?.name ?? "").localeCompare(b.zona?.name ?? "", "es");
    if (zonaCompare !== 0) return zonaCompare;
    return a.fecha.localeCompare(b.fecha);
  });

  const productNames = Array.from(
    new Set(sortedOrders.flatMap((o) => o.items.map((it) => it.product?.name ?? "—"))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  addBrandHeader(workbook, sheet);
  sheet.addRow([]);

  const fixedHeadersLeft = ["N°", "Fecha", "Cliente", "Zona", "Provincia", "Localidad"];
  const fixedHeadersRight = [
    "Vendedor",
    "Chofer",
    "Estado pedido",
    "Estado producción",
    "Día de entrega",
    "Fecha de envío",
  ];

  const headerRow = sheet.addRow([...fixedHeadersLeft, ...productNames, ...fixedHeadersRight]);
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    if (colNumber > fixedHeadersLeft.length && colNumber <= fixedHeadersLeft.length + productNames.length) {
      cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    }
  });
  if (productNames.length > 0) headerRow.height = 45;

  const firstDataRow = headerRow.number + 1;

  for (const order of sortedOrders) {
    const tonnageByProduct = productTonnageByOrder(order);
    const productValues = productNames.map((name) => tonnageByProduct.get(name) || null);

    sheet.addRow([
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.zona?.name ?? "",
      order.provincia ?? "",
      order.localidad ?? "",
      ...productValues,
      order.vendedor?.name ?? "",
      order.chofer?.name ?? "",
      LOGISTICA_LABELS[order.estado_logistica],
      PRODUCCION_LABELS[order.estado_produccion],
      formatDiaEntrega(order.fecha_entrega) ?? "",
      order.fecha_envio ? formatFecha(order.fecha_envio) : "",
    ]);
  }

  const lastDataRow = sheet.lastRow!.number;
  const totalColCount = fixedHeadersLeft.length + productNames.length + fixedHeadersRight.length;

  if (productNames.length > 0 && sortedOrders.length > 0) {
    // SUBTOTAL (no SUM) para que el total de cada producto se recalcule solo
    // según lo que quede visible al filtrar por zona (u otra columna).
    const totalRow = sheet.addRow(["TOTAL", "", "", "", "", ""]);
    productNames.forEach((_, i) => {
      const colIndex = fixedHeadersLeft.length + i + 1;
      const letter = sheet.getColumn(colIndex).letter;
      totalRow.getCell(colIndex).value = {
        formula: `SUBTOTAL(9,${letter}${firstDataRow}:${letter}${lastDataRow})`,
      };
    });
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: NAVY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
      cell.border = { top: { style: "medium", color: { argb: NAVY } } };
    });
  }

  if (sortedOrders.length > 0) {
    sheet.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: lastDataRow, column: totalColCount },
    };
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    ...productNames.map(() => ({ width: 14 })),
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  return workbook;
}
