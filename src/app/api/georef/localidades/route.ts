export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provincia = searchParams.get("provincia");

  if (!provincia) {
    return Response.json({ localidades: [] }, { status: 400 });
  }

  const url = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provincia)}&campos=id,nombre&orden=nombre&max=5000`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return Response.json({ localidades: [] }, { status: 502 });
  }
  const data = await res.json();
  return Response.json({ localidades: data.localidades ?? [] });
}
