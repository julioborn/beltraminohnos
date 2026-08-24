import { notFound } from "next/navigation";
import { getRepartoDetail } from "@/lib/data/repartos";
import { buildRepartoWorkbook } from "@/lib/excel/reparto-excel";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRepartoDetail(id);
  if (!detail) notFound();

  const workbook = await buildRepartoWorkbook(detail);
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reparto.xlsx"`,
    },
  });
}
