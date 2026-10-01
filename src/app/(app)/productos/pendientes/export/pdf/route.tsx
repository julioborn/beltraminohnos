import { renderToBuffer } from "@react-pdf/renderer";
import { getOrdersPendingSummary } from "@/lib/data/orders";
import { getActiveProducts } from "@/lib/data/master-data";
import { buildPendingDayMatrix, buildPendingDetail, type PendingDayMode } from "@/lib/reports/pending-by-day";
import { PendingByDayDocument } from "@/lib/pdf/pending-by-day-document";

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
  const buffer = await renderToBuffer(
    <PendingByDayDocument matrix={matrix} mode={mode} start={start} end={end} detail={detail} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pendientes-por-producto.pdf"`,
    },
  });
}
