import { getOrderNotesNearby, type NearbyFilters } from "@/lib/data/nearby";
import { buildOrderNearbyWorkbook } from "@/lib/excel/order-nearby-excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: NearbyFilters = Object.fromEntries(searchParams.entries());

  const { results, radioKm } = await getOrderNotesNearby(filters);
  const centro = filters.localidad ? `${filters.localidad} (${filters.provincia})` : "—";

  const workbook = await buildOrderNearbyWorkbook(results, centro, radioKm);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pedidos-cercanos.xlsx"`,
    },
  });
}
