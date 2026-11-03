// Comparación de ventas por producto contra el mes anterior — a pedido de
// contable, que mandó una captura hecha con IA como referencia de layout
// (dos barras por producto + tabla de detalle con variación %). Se arma
// a mano con CSS, sin librería de gráficos: no hace falta interacción acá
// (la tabla de abajo ya muestra el desglose completo), así que es un
// Server Component puro — nada de "use client" ni el problema de pasar
// funciones de formato a través del límite server/client.

import { BAR_COLORS } from "@/components/bar-chart-3d";

export type VentasComparisonRow = {
  productName: string;
  montoActual: number;
  montoAnterior: number;
  toneladasActual: number;
  toneladasAnterior: number;
};

const CHART_H_PX = 180;
const MIN_HEIGHT_PCT = 4;
const COLOR_ANTERIOR = "#aab0c4";

function pctChange(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? null : 100;
  return ((actual - anterior) / anterior) * 100;
}

function VariacionBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-btm-black/40">—</span>;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        up ? "bg-btm-entregado-bg text-green-800" : "bg-red-50 text-red-700"
      }`}
    >
      {up ? "↑" : "↓"} {up ? "+" : ""}
      {pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

export function VentasComparison({
  rows,
  mesActualLabel,
  mesAnteriorLabel,
  fmtMonto,
  fmtMontoCompact,
}: {
  rows: VentasComparisonRow[];
  mesActualLabel: string;
  mesAnteriorLabel: string;
  fmtMonto: (value: number) => string;
  fmtMontoCompact: (value: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        No hay ventas para comparar en {mesActualLabel.toLowerCase()} ni en {mesAnteriorLabel.toLowerCase()}.
      </p>
    );
  }

  const max = Math.max(...rows.flatMap((r) => [r.montoActual, r.montoAnterior]), 1);
  const totalActual = rows.reduce((sum, r) => sum + r.montoActual, 0);
  const totalAnterior = rows.reduce((sum, r) => sum + r.montoAnterior, 0);
  const totalToneladasActual = rows.reduce((sum, r) => sum + r.toneladasActual, 0);
  const totalToneladasAnterior = rows.reduce((sum, r) => sum + r.toneladasAnterior, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-black/10 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Ventas por producto</h2>
            <p className="text-xs text-btm-black/50">Comparación con el mes anterior (importes en ARS)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-btm-black/70">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-btm-navy" aria-hidden />
              Mes seleccionado ({mesActualLabel})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLOR_ANTERIOR }} aria-hidden />
              Mes anterior ({mesAnteriorLabel})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-end gap-5 pt-8" style={{ minWidth: rows.length * 92 }}>
            {rows.map((r) => {
              const heightActual = Math.max((r.montoActual / max) * 100, r.montoActual > 0 ? MIN_HEIGHT_PCT : 0);
              const heightAnterior = Math.max((r.montoAnterior / max) * 100, r.montoAnterior > 0 ? MIN_HEIGHT_PCT : 0);
              const variacion = pctChange(r.montoActual, r.montoAnterior);
              return (
                <div key={r.productName} className="flex w-[72px] shrink-0 flex-col items-center">
                  <div className="flex w-full items-end justify-center gap-1" style={{ height: CHART_H_PX }}>
                    <div className="relative flex w-7 flex-col items-center justify-end" style={{ height: "100%" }}>
                      <span className="btm-fig mb-1 text-[10px] font-bold text-btm-navy" title={fmtMonto(r.montoActual)}>
                        {fmtMontoCompact(r.montoActual)}
                      </span>
                      <div className="w-full rounded-t-sm bg-btm-navy" style={{ height: `${heightActual}%` }} />
                    </div>
                    <div className="relative flex w-7 flex-col items-center justify-end" style={{ height: "100%" }}>
                      <span className="btm-fig mb-1 text-[10px] font-semibold text-btm-black/50" title={fmtMonto(r.montoAnterior)}>
                        {fmtMontoCompact(r.montoAnterior)}
                      </span>
                      <div className="w-full rounded-t-sm" style={{ height: `${heightAnterior}%`, backgroundColor: COLOR_ANTERIOR }} />
                    </div>
                  </div>
                  <span className="btm-fig mt-1 text-[10px] font-semibold text-btm-black/50">
                    {r.toneladasActual.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn
                  </span>
                  <span
                    className="mt-0.5 w-full truncate text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/60"
                    title={r.productName}
                  >
                    {r.productName}
                  </span>
                  <div className="mt-1.5">
                    <VariacionBadge pct={variacion} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
            <tr>
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-right">Ventas {mesActualLabel}</th>
              <th className="px-3 py-2.5 text-right">Ventas {mesAnteriorLabel}</th>
              <th className="px-3 py-2.5 text-right">Diferencia</th>
              <th className="px-3 py-2.5 text-right">Variación %</th>
              <th className="px-3 py-2.5 text-right">Cantidad actual (tn)</th>
              <th className="px-3 py-2.5 text-right">Cantidad anterior (tn)</th>
              <th className="px-3 py-2.5 text-right">Var. cantidad %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((r, i) => {
              const diferencia = r.montoActual - r.montoAnterior;
              return (
                <tr key={r.productName}>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                        aria-hidden
                      />
                      {r.productName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">{fmtMonto(r.montoActual)}</td>
                  <td className="px-3 py-2.5 text-right">{fmtMonto(r.montoAnterior)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${diferencia >= 0 ? "text-green-800" : "text-btm-red"}`}>
                    {diferencia >= 0 ? "+" : ""}
                    {fmtMonto(diferencia)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <VariacionBadge pct={pctChange(r.montoActual, r.montoAnterior)} />
                  </td>
                  <td className="px-3 py-2.5 text-right">{r.toneladasActual.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2.5 text-right">{r.toneladasAnterior.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2.5 text-right">
                    <VariacionBadge pct={pctChange(r.toneladasActual, r.toneladasAnterior)} />
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold">
              <td className="px-3 py-2.5">Total</td>
              <td className="px-3 py-2.5 text-right">{fmtMonto(totalActual)}</td>
              <td className="px-3 py-2.5 text-right">{fmtMonto(totalAnterior)}</td>
              <td className={`px-3 py-2.5 text-right ${totalActual - totalAnterior >= 0 ? "text-green-800" : "text-btm-red"}`}>
                {totalActual - totalAnterior >= 0 ? "+" : ""}
                {fmtMonto(totalActual - totalAnterior)}
              </td>
              <td className="px-3 py-2.5 text-right">
                <VariacionBadge pct={pctChange(totalActual, totalAnterior)} />
              </td>
              <td className="px-3 py-2.5 text-right">{totalToneladasActual.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</td>
              <td className="px-3 py-2.5 text-right">{totalToneladasAnterior.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</td>
              <td className="px-3 py-2.5 text-right">
                <VariacionBadge pct={pctChange(totalToneladasActual, totalToneladasAnterior)} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
