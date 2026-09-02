import ExcelJS from "exceljs";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { OrderListItem } from "@/lib/pdf/types";

const NAVY = "FF21305D";
const NAVY_LIGHT = "FFEEF0F6";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });
}

export async function buildOrderListWorkbook(orders: OrderListItem[]) {
  const workbook = new ExcelJS.Workbook();
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
    "Producto",
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

  // Un renglón por producto de la nota (no uno por nota): así cada producto
  // muestra su propia cantidad de toneladas por separado, en vez de un texto
  // combinado o un total global de la nota. Si la nota tiene más de un
  // producto, se deja un renglón en blanco arriba Y abajo de su bloque, para
  // que se note que está separado de las notas de un solo producto (sin
  // duplicar el blanco cuando dos notas de varios productos quedan seguidas).
  const blocks = sortedOrders.map((order) => {
    const sharedFields = [
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.zona?.name ?? "",
      order.provincia ?? "",
      order.localidad ?? "",
    ];
    const trailingFields = [
      order.vendedor?.name ?? "",
      order.chofer?.name ?? "",
      LOGISTICA_LABELS[order.estado_logistica],
      PRODUCCION_LABELS[order.estado_produccion],
      formatDiaEntrega(order.fecha_entrega) ?? "",
      order.fecha_envio ? formatFecha(order.fecha_envio) : "",
    ];

    return {
      isMulti: order.items.length > 1,
      rows: order.items.map((item) => [...sharedFields, item.product?.name ?? "—", item.cantidad, ...trailingFields]),
    };
  });

  blocks.forEach((block, i) => {
    if (i > 0 && (blocks[i - 1].isMulti || block.isMulti)) {
      sheet.addRow([]);
    }
    for (const row of block.rows) sheet.addRow(row);
  });

  const lastDataRow = sheet.lastRow!.number;

  if (sortedOrders.length > 0) {
    const totalRow = sheet.addRow(["TOTAL"]);
    const letter = sheet.getColumn(tonColIndex).letter;
    totalRow.getCell(tonColIndex).value = { formula: `SUBTOTAL(9,${letter}${firstDataRow}:${letter}${lastDataRow})` };
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: NAVY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_LIGHT } };
      cell.border = { top: { style: "medium", color: { argb: NAVY } } };
    });

    sheet.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: lastDataRow, column: headers.length } };
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 26 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  return workbook;
}
