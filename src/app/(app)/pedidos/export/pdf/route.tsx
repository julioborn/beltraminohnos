import { renderToBuffer } from "@react-pdf/renderer";
import { getOrderNotesList, type OrderListFilters } from "@/lib/data/orders";
import { OrderListDocument } from "@/lib/pdf/order-list-document";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: OrderListFilters = Object.fromEntries(searchParams.entries());

  const orders = await getOrderNotesList(filters);
  const buffer = await renderToBuffer(<OrderListDocument orders={orders} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="notas-de-pedido.pdf"`,
    },
  });
}
