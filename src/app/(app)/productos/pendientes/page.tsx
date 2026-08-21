import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrdersPendingSummary } from "@/lib/data/orders";
import { aggregatePendingByProduct, type PendingNoteRef, type PendingProductRow } from "@/lib/reports/pending-by-product";
import { formatFecha } from "@/lib/format";
import { PendingByDayReport } from "./pending-by-day-report";

function formatToneladas(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default async function ProductosPendientesPage() {
  const supabase = await createClient();
  const [{ data: products }, orders] = await Promise.all([
    supabase.from("products").select("id, name").eq("active", true).order("name"),
    getOrdersPendingSummary(),
  ]);

  const rows = aggregatePendingByProduct(products ?? [], orders);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/productos"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Productos
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Pendientes por producto
          </h1>
          <p className="text-sm text-btm-black/60">
            Toneladas totales pendientes de fabricación y de entrega, según las notas de pedido activas.
          </p>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <ProductPendingCard key={row.productId} row={row} />
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            No hay productos cargados.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="w-1/3 px-4 py-3">Pendiente de fabricación</th>
              <th className="w-1/3 px-4 py-3">Pendiente de entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => {
              const empty = row.fabricacionTotal === 0 && row.entregaTotal === 0;
              return (
                <tr key={row.productId} className={empty ? "opacity-40" : ""}>
                  <td className="px-4 py-3 align-top font-medium">{row.productName}</td>
                  <td className="px-4 py-3 align-top">
                    <NotesDetails total={row.fabricacionTotal} notes={row.fabricacionNotes} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <NotesDetails total={row.entregaTotal} notes={row.entregaNotes} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-btm-black/50">
                  No hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PendingByDayReport products={products ?? []} orders={orders} />
    </div>
  );
}

function ProductPendingCard({ row }: { row: PendingProductRow }) {
  const empty = row.fabricacionTotal === 0 && row.entregaTotal === 0;
  return (
    <div className={`btm-card flex flex-col gap-3 p-4 ${empty ? "opacity-40" : ""}`}>
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{row.productName}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">
            Pendiente de fabricación
          </span>
          <NotesDetails total={row.fabricacionTotal} notes={row.fabricacionNotes} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">
            Pendiente de entrega
          </span>
          <NotesDetails total={row.entregaTotal} notes={row.entregaNotes} />
        </div>
      </div>
    </div>
  );
}

function NotesDetails({ total, notes }: { total: number; notes: PendingNoteRef[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-display text-lg font-extrabold text-btm-navy">{formatToneladas(total)} tn</span>
      {notes.length > 0 && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy [&::-webkit-details-marker]:hidden">
            <svg
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 4l6 6-6 6V4z" />
            </svg>
            Ver {notes.length} nota{notes.length === 1 ? "" : "s"}
          </summary>
          <div className="mt-2 flex max-w-sm flex-col divide-y divide-black/5 rounded-md border border-black/10 bg-white">
            {notes.map((n, i) => (
              <Link
                key={`${n.id}-${i}`}
                href={`/pedidos/${n.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-btm-navy/5 hover:text-btm-red"
              >
                <span className="flex flex-col">
                  <span className="font-semibold text-btm-navy">{n.numero}</span>
                  <span className="text-btm-black/70">{n.cliente}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end text-xs text-btm-black/50">
                  <span>{formatToneladas(n.cantidad)} tn</span>
                  <span>{formatFecha(n.fecha)}</span>
                </span>
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
