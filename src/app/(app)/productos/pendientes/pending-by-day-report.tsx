"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { DateRangePicker, type DateRange } from "./date-range-picker";
import {
  buildPendingDayMatrix,
  notesForProduct,
  type PendingDayMode,
  type PendingDayOrder,
  type PendingProductNoteRef,
} from "@/lib/reports/pending-by-day";
import { formatFecha, formatDiaEntrega } from "@/lib/format";

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "long" });

function formatCantidad(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayHeaderParts(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return { day: date.getDate(), weekday: WEEKDAY_FORMATTER.format(date).toUpperCase() };
}

type Selection = { productId: string; productName: string; day: string | null };
type View = { type: "matrix" } | { type: "product"; productId: string; productName: string; day: string | null };

export function PendingByDayReport({
  products,
  orders,
}: {
  products: { id: string; name: string }[];
  orders: PendingDayOrder[];
}) {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [mode, setMode] = useState<PendingDayMode>("fabricacion");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [view, setView] = useState<View>({ type: "matrix" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const matrix = useMemo(() => {
    if (!range.start || !range.end) return null;
    return buildPendingDayMatrix(products, orders, range.start, range.end, mode);
  }, [products, orders, range, mode]);

  const selectionSummary = useMemo(() => {
    if (!selection) return { count: 0, total: 0 };
    const dayRange = selection.day ? { start: selection.day, end: selection.day } : undefined;
    const notes = notesForProduct(orders, selection.productId, mode, dayRange);
    return { count: notes.length, total: notes.reduce((sum, n) => sum + n.cantidad, 0) };
  }, [orders, mode, selection]);

  useEffect(() => {
    if (selection && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selection]);

  function toggleSelection(next: Selection) {
    setSelection((prev) => (prev && prev.productId === next.productId && prev.day === next.day ? null : next));
  }

  function changeMode(next: PendingDayMode) {
    setMode(next);
    setSelection(null);
  }

  if (view.type === "product") {
    return (
      <ProductNotesView
        orders={orders}
        mode={mode}
        onModeChange={setMode}
        productId={view.productId}
        productName={view.productName}
        initialDay={view.day}
        onBack={() => {
          setView({ type: "matrix" });
          setSelection(null);
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
      <p className="text-sm text-btm-black/60">
        Elegí un rango de fechas de entrega para ver cuánto hay pendiente, día por día.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        {matrix && (
          <div className="flex flex-wrap gap-2">
            <ModeButton label="Pendiente de fabricación" active={mode === "fabricacion"} onClick={() => changeMode("fabricacion")} />
            <ModeButton label="Pendiente de entrega" active={mode === "entrega"} onClick={() => changeMode("entrega")} />
          </div>
        )}
      </div>

      {!matrix ? (
        <p className="text-sm text-btm-black/50">Elegí una fecha desde y una fecha hasta para ver la tabla.</p>
      ) : (
        <>
          <p className="text-xs text-btm-black/50">
            Tocá el nombre de un producto para ver todas sus notas pendientes, o tocá un día puntual para ver solo las de ese día.
          </p>
          <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full text-sm">
              <thead className="bg-btm-navy text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                <tr>
                  <th className="sticky left-0 z-10 bg-btm-navy px-2 py-2 text-left sm:px-4 sm:py-2.5">Producto</th>
                  {matrix.days.map((d) => {
                    const { day, weekday } = dayHeaderParts(d);
                    return (
                      <th key={d} className="whitespace-nowrap px-2 py-2 sm:px-3 sm:py-2.5">
                        <span className="block">{day}</span>
                        <span className="block font-normal normal-case text-white/70">{weekday}</span>
                      </th>
                    );
                  })}
                  <th className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-2.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {matrix.rows.map((row) => {
                  const empty = row.total === 0;
                  const isSelectedProduct = selection?.productId === row.productId;
                  return (
                    <Fragment key={row.productId}>
                      <tr className={empty ? "opacity-40" : ""}>
                        <td className="sticky left-0 z-10 max-w-[100px] bg-white p-0 font-medium sm:max-w-none">
                          <button
                            type="button"
                            onClick={() => toggleSelection({ productId: row.productId, productName: row.productName, day: null })}
                            className={`w-full cursor-pointer px-2 py-1.5 text-left text-xs leading-tight whitespace-normal hover:bg-btm-navy/5 hover:text-btm-red sm:px-4 sm:py-2 sm:text-sm sm:whitespace-nowrap ${
                              isSelectedProduct && !selection?.day ? "text-btm-red" : ""
                            }`}
                          >
                            {row.productName}
                          </button>
                        </td>
                        {matrix.days.map((d) => {
                          const isSelectedCell = isSelectedProduct && selection?.day === d;
                          return (
                            <td key={d} className="whitespace-nowrap p-0 text-center text-btm-black/70">
                              <button
                                type="button"
                                onClick={() => toggleSelection({ productId: row.productId, productName: row.productName, day: d })}
                                className={`w-full cursor-pointer px-2 py-1.5 text-xs hover:bg-btm-navy/5 hover:text-btm-red sm:px-3 sm:py-2 sm:text-sm ${
                                  isSelectedCell ? "bg-btm-navy/10 font-semibold text-btm-red" : ""
                                }`}
                              >
                                {formatCantidad(row.byDay[d] ?? 0)}
                              </button>
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap px-2 py-1.5 text-center text-xs font-bold text-btm-navy sm:px-4 sm:py-2 sm:text-sm">
                          {formatCantidad(row.total)}
                        </td>
                      </tr>
                      {isSelectedProduct && (
                        <tr>
                          <td colSpan={matrix.days.length + 2} className="bg-btm-navy/5 p-0">
                            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                              <div>
                                <p className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy sm:text-sm">
                                  {row.productName}
                                </p>
                                <p className="text-xs text-btm-black/60">
                                  {selectionSummary.count} nota{selectionSummary.count === 1 ? "" : "s"} · {formatCantidad(selectionSummary.total)} tn
                                  {selection?.day ? ` · ${formatDiaEntrega(selection.day)}` : " · todas las fechas"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setView({ type: "product", productId: row.productId, productName: row.productName, day: selection?.day ?? null })
                                }
                                className="shrink-0 cursor-pointer self-start rounded-full border border-btm-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:self-auto"
                              >
                                Ver notas
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
        </>
      )}
    </section>
  );
}

function ProductNotesView({
  orders,
  mode,
  onModeChange,
  productId,
  productName,
  initialDay,
  onBack,
}: {
  orders: PendingDayOrder[];
  mode: PendingDayMode;
  onModeChange: (mode: PendingDayMode) => void;
  productId: string;
  productName: string;
  initialDay: string | null;
  onBack: () => void;
}) {
  const [range, setRange] = useState<DateRange>({ start: initialDay, end: initialDay });

  const notes = useMemo(() => {
    const dayRange = range.start && range.end ? { start: range.start, end: range.end } : undefined;
    return notesForProduct(orders, productId, mode, dayRange);
  }, [orders, productId, mode, range]);

  const total = notes.reduce((sum, n) => sum + n.cantidad, 0);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
        </svg>
        Volver a la tabla
      </button>

      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-navy">{productName}</h2>

      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="flex flex-wrap gap-2">
          <ModeButton label="Pendiente de fabricación" active={mode === "fabricacion"} onClick={() => onModeChange("fabricacion")} />
          <ModeButton label="Pendiente de entrega" active={mode === "entrega"} onClick={() => onModeChange("entrega")} />
        </div>
      </div>

      <p className="text-sm text-btm-black/60">
        {notes.length} nota{notes.length === 1 ? "" : "s"} · {formatCantidad(total)} tn
        {range.start && range.end ? "" : " · sin filtro de fecha"}
      </p>

      {notes.length === 0 ? (
        <p className="text-sm text-btm-black/50">No hay notas para mostrar.</p>
      ) : (
        <div className="flex flex-col divide-y divide-black/5 rounded-md border border-black/10 bg-white">
          {notes.map((n, i) => (
            <Link
              key={`${n.id}-${i}`}
              href={`/pedidos/${n.id}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-btm-navy/5 hover:text-btm-red"
            >
              <span className="flex flex-col">
                <span className="font-semibold text-btm-navy">{n.numero}</span>
                <span className="text-btm-black/70">{n.cliente}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end text-xs text-btm-black/50">
                <span>{formatCantidad(n.cantidad)} tn</span>
                <span>{n.fecha_entrega ? formatFecha(n.fecha_entrega) : "Sin fecha"}</span>
              </span>
            </Link>
          ))}
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
