const DOLAR_URL = "https://dolarapi.com/v1/dolares/oficial";

export async function getDolarOficial(): Promise<{ venta: number | null; compra: number | null; fecha: string | null }> {
  const res = await fetch(DOLAR_URL, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return { venta: null, compra: null, fecha: null };
  }
  const data = await res.json();
  return {
    venta: typeof data.venta === "number" ? data.venta : null,
    compra: typeof data.compra === "number" ? data.compra : null,
    fecha: data.fechaActualizacion ?? null,
  };
}
