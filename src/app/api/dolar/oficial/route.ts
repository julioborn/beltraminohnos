const DOLAR_URL = "https://dolarapi.com/v1/dolares/oficial";

export async function GET() {
  const res = await fetch(DOLAR_URL, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return Response.json({ venta: null, compra: null, fecha: null }, { status: 502 });
  }
  const data = await res.json();
  return Response.json({
    venta: typeof data.venta === "number" ? data.venta : null,
    compra: typeof data.compra === "number" ? data.compra : null,
    fecha: data.fechaActualizacion ?? null,
  });
}
