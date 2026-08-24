import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { getRepartoDetail } from "@/lib/data/repartos";
import { RepartoDocument } from "@/lib/pdf/reparto-document";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRepartoDetail(id);
  if (!detail) notFound();

  const buffer = await renderToBuffer(<RepartoDocument {...detail} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reparto.pdf"`,
    },
  });
}
