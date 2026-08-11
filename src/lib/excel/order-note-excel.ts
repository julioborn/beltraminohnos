import ExcelJS from "exceljs";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { LOGISTICA_LABELS, PRODUCCION_LABELS } from "@/components/estado-badge";
import { formatDiaEntrega, formatFecha } from "@/lib/format";
import { addBrandHeader } from "./brand-header";
import type { OrderNoteDetail } from "@/lib/pdf/types";

const NAVY = "FF21305D";

export async function buildOrderNoteWorkbook({ order, history }: OrderNoteDetail) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nota de pedido");

  addBrandHeader(workbook, sheet);
  sheet.addRow([]);

  sheet.addRow(["Nota N°", order.numero]);
  sheet.addRow(["Cliente", order.cliente]);
  sheet.addRow(["Zona", order.zona?.name ?? ""]);
  sheet.addRow(["Provincia", order.provincia ?? ""]);
  sheet.addRow(["Localidad", order.localidad ?? ""]);
  sheet.addRow(["Fecha", formatFecha(order.fecha)]);
  sheet.addRow(["Día de entrega", formatDiaEntrega(order.fecha_entrega) ?? ""]);
  sheet.addRow(["Vendedor", order.vendedor?.name ?? ""]);
  sheet.addRow(["Chofer", order.chofer?.name ?? ""]);
  sheet.addRow(["Estado pedido", LOGISTICA_LABELS[order.estado_logistica]]);
  sheet.addRow(["Estado producción", PRODUCCION_LABELS[order.estado_produccion]]);
  sheet.addRow(["Observaciones", order.observaciones ?? ""]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Producto", "Envase", "Cantidad", "Precio USD/tn", "Subtotal USD"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  let total = 0;
  for (const item of order.items) {
    const subtotal = item.cantidad * item.precio_unitario;
    total += subtotal;
    sheet.addRow([
      item.product?.name ?? "",
      PACKAGING_LABELS[item.tipo_envase as PackagingType],
      item.cantidad,
      item.precio_unitario,
      subtotal,
    ]);
  }

  const totalRow = sheet.addRow(["", "", "", "Total", total]);
  totalRow.font = { bold: true };

  sheet.addRow([]);
  sheet.addRow(["Historial de estados"]).font = { bold: true };
  for (const h of history) {
    const campoLabel = h.campo === "PRODUCCION" ? "Producción" : "Pedido";
    const estadoLabel =
      h.campo === "PRODUCCION"
        ? PRODUCCION_LABELS[h.estado as "PENDIENTE" | "FABRICADO"]
        : LOGISTICA_LABELS[h.estado as "PENDIENTE" | "ENTREGADO"];
    sheet.addRow([`${campoLabel}: ${estadoLabel}`, new Date(h.changed_at).toLocaleString("es-AR")]);
  }

  sheet.columns = [{ width: 28 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 14 }];

  return workbook;
}
