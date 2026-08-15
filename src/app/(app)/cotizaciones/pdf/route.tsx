import { renderToBuffer } from "@react-pdf/renderer";
import { QuoteDocument, type QuoteDocumentProps } from "@/lib/pdf/quote-document";

// Unlike the other PDF export routes (all GET, backed by a DB lookup or
// searchParams), a cotización has no persisted record to look up — it's
// built entirely from the payload the form already resolved client-side.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as QuoteDocumentProps | null;

  if (!body || typeof body.cliente !== "string" || !Array.isArray(body.items)) {
    return new Response("Invalid payload", { status: 400 });
  }

  const buffer = await renderToBuffer(<QuoteDocument {...body} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotizacion.pdf"`,
    },
  });
}
