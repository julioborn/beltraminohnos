import ExcelJS from "exceljs";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { ESTADO_LABELS } from "@/components/estado-badge";
import type { OrderListItem } from "@/lib/pdf/types";

const NAVY = "FF21305D";

export async function buildOrderListWorkbook(orders: OrderListItem[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Notas de pedido");

  const headerRow = sheet.addRow([
    "N°",
    "Fecha",
    "Cliente",
    "Zona",
    "Provincia",
    "Localidad",
    "Productos",
    "Vendedor",
    "Chofer",
    "Estado",
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
      order.fecha,
      order.cliente,
      order.zona?.name ?? "",
      order.provincia ?? "",
      order.localidad ?? "",
      order.items
        .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
        .join(", "),
      order.vendedor?.name ?? "",
      order.chofer?.name ?? "",
      ESTADO_LABELS[order.estado],
      order.dia_entrega ?? "",
      order.fecha_envio ?? "",
    ]);
  }

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 50 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
  ];

  return workbook;
}
