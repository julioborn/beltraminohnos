import ExcelJS from "exceljs";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { getOrderNotesNearby } from "@/lib/data/nearby";

type NearbyOrderItem = Awaited<ReturnType<typeof getOrderNotesNearby>>["results"][number];

const NAVY = "FF21305D";

export async function buildOrderNearbyWorkbook(orders: NearbyOrderItem[], centro: string, radioKm: number) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pedidos cercanos");

  addBrandHeader(workbook, sheet);
  sheet.addRow([`Centro: ${centro} · Radio: ${radioKm} km · ${orders.length} resultados`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "N°",
    "Fecha",
    "Cliente",
    "Zona",
    "Provincia",
    "Localidad",
    "Distancia (km)",
    "Productos",
    "Vendedor",
    "Chofer",
    "Estado pedido",
    "Estado producción",
    "Día de entrega",
    "Fecha de envío",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  for (const order of orders) {
    sheet.addRow([
      order.numero,
      formatFecha(order.fecha),
      order.cliente,
      order.zona?.name ?? "",
      order.provincia ?? "",
      order.localidad ?? "",
      Math.round(order.distancia_km),
      order.items
        .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
        .join(", "),
      order.vendedor?.name ?? "",
      order.chofer?.name ?? "",
      LOGISTICA_LABELS[order.estado_logistica],
      PRODUCCION_LABELS[order.estado_produccion],
      formatDiaEntrega(order.fecha_entrega) ?? "",
      order.fecha_envio ? formatFecha(order.fecha_envio) : "",
    ]);
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 14 },
    { width: 50 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
  ];

  return workbook;
}
