import { notFound } from "next/navigation";
import { getOrderNoteDetail } from "@/lib/data/orders";
import { buildOrderNoteWorkbook } from "@/lib/excel/order-note-excel";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getOrderNoteDetail(id);
  if (!detail) notFound();

  const workbook = await buildOrderNoteWorkbook(detail);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="nota-${detail.order.numero}.xlsx"`,
    },
  });
}
