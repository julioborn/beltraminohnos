"use client";

import { useMemo, useState } from "react";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import { buildPendingDayMatrix, type PendingDayMode, type PendingDayOrder } from "@/lib/reports/pending-by-day";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "long" });

function formatCantidad(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayHeaderParts(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return { day: date.getDate(), weekday: WEEKDAY_FORMATTER.format(date).toUpperCase() };
}

export function PendingByDayReport({
  products,
  orders,
}: {
  products: { id: string; name: string }[];
  orders: PendingDayOrder[];
}) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [mode, setMode] = useState<PendingDayMode>("fabricacion");

  const matrix = useMemo(() => {
    if (!range.start || !range.end) return null;
    return buildPendingDayMatrix(products, orders, range.start, range.end, mode);
  }, [products, orders, range, mode]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
      <p className="text-sm text-btm-black/60">
        Elegí un rango de fechas de entrega para ver cuánto hay pendiente, día por día.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        {matrix && (
          <div className="flex flex-wrap gap-2">
            <ModeButton
              label="Pendiente de fabricación"
              active={mode === "fabricacion"}
              onClick={() => setMode("fabricacion")}
            />
            <ModeButton label="Pendiente de entrega" active={mode === "entrega"} onClick={() => setMode("entrega")} />
          </div>
        )}
      </div>

      {!matrix ? (
        <p className="text-sm text-btm-black/50">Elegí una fecha desde y una fecha hasta para ver la tabla.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full text-sm">
            <thead className="bg-btm-navy text-center text-[11px] font-semibold uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-2.5 text-left">Producto</th>
                {matrix.days.map((d) => {
                  const { day, weekday } = dayHeaderParts(d);
                  return (
                    <th key={d} className="whitespace-nowrap px-3 py-2.5">
                      <span className="block">{day}</span>
                      <span className="block font-normal normal-case text-white/70">{weekday}</span>
                    </th>
                  );
                })}
                <th className="whitespace-nowrap px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {matrix.rows.map((row) => {
                const empty = row.total === 0;
                return (
                  <tr key={row.productId} className={empty ? "opacity-40" : ""}>
                    <td className="whitespace-nowrap px-4 py-2 font-medium">{row.productName}</td>
                    {matrix.days.map((d) => (
                      <td key={d} className="whitespace-nowrap px-3 py-2 text-center text-btm-black/70">
                        {formatCantidad(row.byDay[d] ?? 0)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-2 text-center font-bold text-btm-navy">
                      {formatCantidad(row.total)}
                    </td>
                  </tr>
                );
              })}
              {matrix.rows.length === 0 && (
                <tr>
                  <td colSpan={matrix.days.length + 2} className="px-4 py-8 text-center text-btm-black/50">
                    No hay productos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active ? "border-btm-navy bg-btm-navy text-white" : "border-btm-navy text-btm-navy hover:bg-btm-navy/10"
      }`}
    >
      {label}
    </button>
  );
}
