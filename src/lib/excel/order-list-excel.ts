import ExcelJS from "exceljs";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { OrderListItem } from "@/lib/pdf/types";

const NAVY = "FF21305D";
const NAVY_LIGHT = "FFEEF0F6";

function orderTonnage(order: OrderListItem) {
  return order.items.reduce((sum, it) => sum + it.cantidad, 0);
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: NAVY } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
    cell.border = { top: { style: "medium", color: { argb: NAVY } } };
  });
}

function addNotesSheet(workbook: ExcelJS.Workbook, orders: OrderListItem[]) {
  const sheet = workbook.addWorksheet("Notas de pedido");

  // Agrupa visualmente por zona (y dentro de cada zona, por fecha) para que,
  // combinado con el AutoFilter, se pueda aislar una zona puntual.
  const sortedOrders = [...orders].sort((a, b) => {
    const zonaCompare = (a.zona?.name ?? "").localeCompare(b.zona?.name ?? "", "es");
    if (zonaCompare !== 0) return zonaCompare;
    return a.fecha.localeCompare(b.fecha);
  });

  addBrandHeader(workbook, sheet);
  sheet.addRow([]);

  const headers = [
    "N°",
    "Fecha",
    "Cliente",
    "Zona",
    "Provincia",
    "Localidad",
    "Productos",
    "Toneladas",
    "Vendedor",
    "Chofer",
    "Estado pedido",
    "Estado producción",
    "Día de entrega",
    "Fecha de envío",
  ];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  const tonColIndex = headers.indexOf("Toneladas") + 1;
  const firstDataRow = headerRow.number + 1;

  for (const order of sortedOrders) {
    sheet.addRow([
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.zona?.name ?? "",
      order.provincia ?? "",
      order.localidad ?? "",
      order.items
        .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
        .join(", "),
      orderTonnage(order),
      order.vendedor?.name ?? "",
      order.chofer?.name ?? "",
      LOGISTICA_LABELS[order.estado_logistica],
      PRODUCCION_LABELS[order.estado_produccion],
      formatDiaEntrega(order.fecha_entrega) ?? "",
      order.fecha_envio ? formatFecha(order.fecha_envio) : "",
    ]);
  }

  const lastDataRow = sheet.lastRow!.number;

  if (sortedOrders.length > 0) {
    const totalRow = sheet.addRow(["TOTAL"]);
    const letter = sheet.getColumn(tonColIndex).letter;
    totalRow.getCell(tonColIndex).value = { formula: `SUBTOTAL(9,${letter}${firstDataRow}:${letter}${lastDataRow})` };
    styleTotalRow(totalRow);

    sheet.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: lastDataRow, column: headers.length } };
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 50 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];
}

function productTonnageByOrder(order: OrderListItem) {
  const map = new Map<string, number>();
  for (const it of order.items) {
    const name = it.product?.name;
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + it.cantidad);
  }
  return map;
}

// Una fila por nota, una columna por producto: acá se lee directo cuántas
// toneladas de CADA producto tiene esa nota puntual (la hoja "Notas de
// pedido" solo trae el total global de la nota).
function addNoteProductDetailSheet(workbook: ExcelJS.Workbook, orders: OrderListItem[]) {
  const productNames = Array.from(
    new Set(orders.flatMap((o) => o.items.map((it) => it.product?.name).filter((n): n is string => Boolean(n)))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  if (productNames.length === 0) return;

  const sortedOrders = [...orders].sort((a, b) => {
    const zonaCompare = (a.zona?.name ?? "").localeCompare(b.zona?.name ?? "", "es");
    if (zonaCompare !== 0) return zonaCompare;
    return a.fecha.localeCompare(b.fecha);
  });

  const sheet = workbook.addWorksheet("Detalle por producto");
  addBrandHeader(workbook, sheet);
  sheet.addRow([]);

  const fixedHeaders = ["N°", "Fecha", "Cliente", "Zona"];
  const headers = [...fixedHeaders, ...productNames, "Total"];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);
  headerRow.getCell(headers.length).alignment = { vertical: "middle" };
  productNames.forEach((_, i) => {
    headerRow.getCell(fixedHeaders.length + i + 1).alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 45;

  const firstDataRow = headerRow.number + 1;
  const totalColIndex = headers.length;

  for (const order of sortedOrders) {
    const tonnageByProduct = productTonnageByOrder(order);
    const productValues = productNames.map((name) => tonnageByProduct.get(name) || null);
    sheet.addRow([
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.zona?.name ?? "",
      ...productValues,
      orderTonnage(order),
    ]);
  }

  const lastDataRow = sheet.lastRow!.number;

  const totalRow = sheet.addRow(["TOTAL"]);
  productNames.forEach((_, i) => {
    const colIndex = fixedHeaders.length + i + 1;
    const letter = sheet.getColumn(colIndex).letter;
    totalRow.getCell(colIndex).value = { formula: `SUBTOTAL(9,${letter}${firstDataRow}:${letter}${lastDataRow})` };
  });
  const totalColLetter = sheet.getColumn(totalColIndex).letter;
  totalRow.getCell(totalColIndex).value = {
    formula: `SUBTOTAL(9,${totalColLetter}${firstDataRow}:${totalColLetter}${lastDataRow})`,
  };
  styleTotalRow(totalRow);

  sheet.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: lastDataRow, column: headers.length } };

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    ...productNames.map(() => ({ width: 13 })),
    { width: 13 },
  ];
}

export async function buildOrderListWorkbook(orders: OrderListItem[]) {
  const workbook = new ExcelJS.Workbook();
  addNotesSheet(workbook, orders);
  addNoteProductDetailSheet(workbook, orders);
  return workbook;
}
