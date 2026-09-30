import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthUser } from "@/lib/auth/role";
import { getMyOrderNoteDetail } from "@/lib/data/orders";
import { OrderNoteDocument } from "@/lib/pdf/order-note-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) notFound();

  const detail = await getMyOrderNoteDetail(id, user.id);
  if (!detail) notFound();

  const buffer = await renderToBuffer(<OrderNoteDocument order={detail.order} history={detail.history} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nota-${detail.order.numero}.pdf"`,
    },
  });
}
