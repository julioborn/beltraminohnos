import Link from "next/link";
import { formatUsd } from "@/lib/format";
import type { ClienteReportRow } from "@/lib/reports/cliente-report";

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

function sumMetric(rows: ClienteReportRow[], key: "entregado" | "pendienteFabricar" | "pendienteEntregar" | "total") {
  return rows.reduce(
    (acc, r) => ({ cantidad: acc.cantidad + r[key].cantidad, monto: acc.monto + r[key].monto }),
    { cantidad: 0, monto: 0 },
  );
}

export function ClienteReportTable({
  rows,
  mode,
  linkQuery,
}: {
  rows: ClienteReportRow[];
  mode: "productos" | "clientes";
  // querystring (sin "cliente") para armar el link de drill-down desde la
  // vista "todos los clientes" — mantiene año/productos elegidos.
  linkQuery?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        No hay ventas para este filtro.
      </p>
    );
  }

  const totals = {
    entregado: sumMetric(rows, "entregado"),
    pendienteFabricar: sumMetric(rows, "pendienteFabricar"),
    pendienteEntregar: sumMetric(rows, "pendienteEntregar"),
    total: sumMetric(rows, "total"),
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
          <tr>
            <th className="px-3 py-2.5">{mode === "productos" ? "Producto" : "Cliente"}</th>
            <th className="px-3 py-2.5 text-right">Entregado</th>
            <th className="px-3 py-2.5 text-right">Pendiente de fabricar</th>
            <th className="px-3 py-2.5 text-right">Pendiente de entregar</th>
            <th className="px-3 py-2.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-3 py-2.5 font-semibold text-btm-navy">
                {mode === "clientes" ? (
                  <Link href={`/reportes/clientes?cliente=${encodeURIComponent(r.key)}${linkQuery ? `&${linkQuery}` : ""}`} className="hover:text-btm-red">
                    {r.label}
                  </Link>
                ) : (
                  r.label
                )}
              </td>
              <MetricCell metric={r.entregado} />
              <MetricCell metric={r.pendienteFabricar} />
              <MetricCell metric={r.pendienteEntregar} />
              <MetricCell metric={r.total} bold />
            </tr>
          ))}
        </tbody>
        <tfoot className="font-bold">
          <tr className="border-t border-black/10">
            <td className="px-3 py-2.5">Total</td>
            <MetricCell metric={totals.entregado} bold />
            <MetricCell metric={totals.pendienteFabricar} bold />
            <MetricCell metric={totals.pendienteEntregar} bold />
            <MetricCell metric={totals.total} bold />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MetricCell({ metric, bold = false }: { metric: { cantidad: number; monto: number }; bold?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-right ${bold ? "font-bold text-btm-navy" : ""}`}>
      <div>{formatUsd(metric.monto)}</div>
      <div className="text-xs font-normal text-btm-black/50">{formatTn(metric.cantidad)}</div>
    </td>
  );
}
