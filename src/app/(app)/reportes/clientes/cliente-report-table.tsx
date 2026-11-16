import Link from "next/link";
import type { ClienteReportRow } from "@/lib/reports/cliente-report";

const PAGE_SIZE = 20;

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
  fmtMonto,
  page = 1,
  pageHref,
}: {
  rows: ClienteReportRow[];
  mode: "productos" | "clientes";
  // querystring (sin "cliente") para armar el link de drill-down desde la
  // vista "todos los clientes" — mantiene año/productos elegidos.
  linkQuery?: string;
  // Respeta el switch ARS/USD del header — ver fmtMontoUsd en page.tsx.
  fmtMonto: (valueUsd: number) => string;
  page?: number;
  // Arma el link a otra página manteniendo el resto de los filtros — ver
  // pageHref en page.tsx.
  pageHref?: (targetPage: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        No hay ventas para este filtro.
      </p>
    );
  }

  // Los totales siempre se calculan sobre todas las filas del filtro
  // actual, no solo las de la página visible.
  const totals = {
    entregado: sumMetric(rows, "entregado"),
    pendienteFabricar: sumMetric(rows, "pendienteFabricar"),
    pendienteEntregar: sumMetric(rows, "pendienteEntregar"),
    total: sumMetric(rows, "total"),
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
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
            {pageRows.map((r) => (
              <tr key={r.key}>
                <td className="px-3 py-2.5 font-semibold text-btm-navy">
                  {mode === "clientes" ? (
                    <Link
                      href={`/reportes/clientes?cliente=${encodeURIComponent(r.key)}${linkQuery ? `&${linkQuery}` : ""}`}
                      className="hover:text-btm-red"
                    >
                      {r.label}
                    </Link>
                  ) : (
                    r.label
                  )}
                </td>
                <MetricCell metric={r.entregado} fmtMonto={fmtMonto} />
                <MetricCell metric={r.pendienteFabricar} fmtMonto={fmtMonto} />
                <MetricCell metric={r.pendienteEntregar} fmtMonto={fmtMonto} />
                <MetricCell metric={r.total} fmtMonto={fmtMonto} bold />
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold">
            <tr className="border-t border-black/10">
              <td className="px-3 py-2.5">Total</td>
              <MetricCell metric={totals.entregado} fmtMonto={fmtMonto} bold />
              <MetricCell metric={totals.pendienteFabricar} fmtMonto={fmtMonto} bold />
              <MetricCell metric={totals.pendienteEntregar} fmtMonto={fmtMonto} bold />
              <MetricCell metric={totals.total} fmtMonto={fmtMonto} bold />
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && pageHref && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-btm-black/50">
            Página {currentPage} de {totalPages} · {rows.length} {mode === "productos" ? "productos" : "clientes"}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
              >
                Anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                Anterior
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
              >
                Siguiente
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                Siguiente
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCell({
  metric,
  fmtMonto,
  bold = false,
}: {
  metric: { cantidad: number; monto: number };
  fmtMonto: (valueUsd: number) => string;
  bold?: boolean;
}) {
  return (
    <td className={`px-3 py-2.5 text-right ${bold ? "font-bold text-btm-navy" : ""}`}>
      <div>{fmtMonto(metric.monto)}</div>
      <div className="text-xs font-normal text-btm-black/50">{formatTn(metric.cantidad)}</div>
    </td>
  );
}
