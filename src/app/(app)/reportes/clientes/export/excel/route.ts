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
  const productos = searchParams.get("productos")?.split(",").filter(Boolean) ?? [];

  const orders = await getOrdersForClienteReport({ cliente, productos, anio });

  const mode = cliente ? "productos" : "clientes";
  const rows = mode === "productos" ? aggregateClienteProductos(orders) : aggregateClientesResumen(orders);
  const titulo = cliente ? `${cliente} · ${anio ?? ""}` : `Todos los clientes · ${anio ?? ""}`;

  const workbook = await buildClienteReportWorkbook(rows, mode, titulo);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe-por-cliente.xlsx"`,
    },
  });
}
