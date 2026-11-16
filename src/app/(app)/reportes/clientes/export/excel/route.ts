import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getOrdersForClienteReport } from "@/lib/data/orders";
import { aggregateClienteProductos, aggregateClientesResumen } from "@/lib/reports/cliente-report";
import { buildClienteReportWorkbook } from "@/lib/excel/cliente-report-excel";

export async function GET(request: Request) {
  if (!hasFullAccess(await getProfileRole())) {
    return new Response("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cliente = searchParams.get("cliente") ?? undefined;
  const anio = searchParams.get("anio") ?? undefined;
  const mes = searchParams.get("mes") ? Number(searchParams.get("mes")) : undefined;
  const productos = searchParams.get("productos")?.split(",").filter(Boolean) ?? [];

  const orders = await getOrdersForClienteReport({ cliente, productos, anio });
  // Mismo criterio que la pantalla: el filtro de mes acota acá en JS, no en
  // la consulta (ver cliente-report/page.tsx).
  const ordersDelMes = mes ? orders.filter((o) => Number(o.fecha.slice(5, 7)) === mes) : orders;

  const mode = cliente ? "productos" : "clientes";
  const rows = mode === "productos" ? aggregateClienteProductos(ordersDelMes) : aggregateClientesResumen(ordersDelMes);
  const mesLabel = mes ? ` · mes ${mes}` : "";
  const titulo = cliente ? `${cliente} · ${anio ?? ""}${mesLabel}` : `Todos los clientes · ${anio ?? ""}${mesLabel}`;

  const workbook = await buildClienteReportWorkbook(rows, mode, titulo);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe-por-cliente.xlsx"`,
    },
  });
}
