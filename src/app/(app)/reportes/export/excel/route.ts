import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getOrdersForReports, type ReportFilters } from "@/lib/data/orders";
import { buildReportsWorkbook } from "@/lib/excel/reports-excel";

export async function GET(request: Request) {
  if (!hasFullAccess(await getProfileRole())) {
    return new Response("No autorizado", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters: ReportFilters = Object.fromEntries(searchParams.entries());

  const orders = await getOrdersForReports(filters);
  const workbook = await buildReportsWorkbook(orders);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reportes.xlsx"`,
    },
  });
}
