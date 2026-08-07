const GEOREF_URL = "https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&orden=nombre&max=25";

export async function GET() {
  const res = await fetch(GEOREF_URL, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return Response.json({ provincias: [] }, { status: 502 });
  }
  const data = await res.json();
  return Response.json({ provincias: data.provincias ?? [] });
}
