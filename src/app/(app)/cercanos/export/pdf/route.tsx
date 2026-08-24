import { renderToBuffer } from "@react-pdf/renderer";
import { getOrderNotesNearby, type NearbyFilters } from "@/lib/data/nearby";
import { OrderNearbyDocument } from "@/lib/pdf/order-nearby-document";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: NearbyFilters = Object.fromEntries(searchParams.entries());

  const { results, radioKm } = await getOrderNotesNearby(filters);
  const centro = filters.localidad ? `${filters.localidad} (${filters.provincia})` : "—";

  const buffer = await renderToBuffer(<OrderNearbyDocument orders={results} centro={centro} radioKm={radioKm} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pedidos-cercanos.pdf"`,
    },
  });
}
