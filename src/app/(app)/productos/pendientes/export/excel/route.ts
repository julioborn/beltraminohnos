import { getOrdersPendingSummary } from "@/lib/data/orders";
import { getActiveProducts } from "@/lib/data/master-data";
import { buildPendingDayMatrix, buildPendingDetail, type PendingDayMode } from "@/lib/reports/pending-by-day";
import { buildPendingByDayWorkbook } from "@/lib/excel/pending-by-day-excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const modeParam = searchParams.get("mode");
  const mode: PendingDayMode = modeParam === "entrega" || modeParam === "fabricado" ? modeParam : "fabricacion";

  if (!start || !end) {
    return new Response("Falta el rango de fechas.", { status: 400 });
  }

  const [products, orders] = await Promise.all([getActiveProducts(), getOrdersPendingSummary()]);
  const matrix = buildPendingDayMatrix(products, orders, start, end, mode);
  const detail = buildPendingDetail(matrix, orders, mode, { start, end });
  const workbook = await buildPendingByDayWorkbook(matrix, mode, start, end, detail);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pendientes-por-producto.xlsx"`,
    },
  });
}
