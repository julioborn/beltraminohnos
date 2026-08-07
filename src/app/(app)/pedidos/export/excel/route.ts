import { getOrderNotesList, type OrderListFilters } from "@/lib/data/orders";
import { buildOrderListWorkbook } from "@/lib/excel/order-list-excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters: OrderListFilters = Object.fromEntries(searchParams.entries());

  const orders = await getOrderNotesList(filters);
  const workbook = await buildOrderListWorkbook(orders);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="notas-de-pedido.xlsx"`,
    },
  });
}
