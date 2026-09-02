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

function addProductByZoneSheet(workbook: ExcelJS.Workbook, orders: OrderListItem[]) {
  const zoneNames = Array.from(new Set(orders.map((o) => o.zona?.name).filter((n): n is string => Boolean(n)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const productNames = Array.from(
    new Set(orders.flatMap((o) => o.items.map((it) => it.product?.name).filter((n): n is string => Boolean(n)))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  if (productNames.length === 0) return;

  const sheet = workbook.addWorksheet("Totales por producto y zona");
  addBrandHeader(workbook, sheet);
  sheet.addRow([]);

  const headers = ["Producto", ...zoneNames, "Total"];
  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  // productName -> zoneName -> toneladas
  const totals = new Map<string, Map<string, number>>();
  for (const order of orders) {
    const zoneName = order.zona?.name;
    if (!zoneName) continue;
    for (const it of order.items) {
      const productName = it.product?.name;
      if (!productName) continue;
      const byZone = totals.get(productName) ?? new Map<string, number>();
      byZone.set(zoneName, (byZone.get(zoneName) ?? 0) + it.cantidad);
      totals.set(productName, byZone);
    }
  }

  const firstDataRow = headerRow.number + 1;
  for (const productName of productNames) {
    const byZone = totals.get(productName) ?? new Map<string, number>();
    const rowValues = zoneNames.map((z) => byZone.get(z) || null);
    sheet.addRow([productName, ...rowValues, null]);
  }

  const lastDataRow = sheet.lastRow!.number;
  const totalColIndex = headers.length;
  const totalColLetter = sheet.getColumn(totalColIndex).letter;

  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const firstZoneLetter = sheet.getColumn(2).letter;
    const lastZoneLetter = sheet.getColumn(1 + zoneNames.length).letter;
    sheet.getRow(r).getCell(totalColIndex).value = {
      formula: `SUM(${firstZoneLetter}${r}:${lastZoneLetter}${r})`,
    };
  }

  const totalRow = sheet.addRow(["TOTAL"]);
  for (let c = 2; c <= headers.length; c++) {
    const letter = sheet.getColumn(c).letter;
    totalRow.getCell(c).value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
  }
  styleTotalRow(totalRow);

  sheet.columns = [{ width: 28 }, ...zoneNames.map(() => ({ width: 16 })), { width: 14 }];
}

export async function buildOrderListWorkbook(orders: OrderListItem[]) {
  const workbook = new ExcelJS.Workbook();
  addNotesSheet(workbook, orders);
  addProductByZoneSheet(workbook, orders);
  return workbook;
}
