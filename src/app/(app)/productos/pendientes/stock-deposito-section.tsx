"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cargarStock } from "@/lib/actions/stock";
import type { ProductStockBalance } from "@/lib/data/stock";

function formatCantidad(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Stock precargado a mano (no atado a un pedido puntual) — separado del
// "fabricado, pendiente de entrega" que ya se calcula por nota más abajo.
// Se sigue cargando en el tiempo y se descuenta solo cuando se entrega
// cualquier pedido de ese producto (lo hace el trigger de order_items).
export function StockDepositoSection({
  products,
  balances,
}: {
  products: { id: string; name: string }[];
  balances: ProductStockBalance[];
}) {
  const [state, formAction, pending] = useActionState(cargarStock, undefined);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state && "success" in state) {
      setFormKey((k) => k + 1);
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const nonZero = balances
    .filter((b) => b.cantidad !== 0)
    .map((b) => ({ ...b, productName: nameById.get(b.productId) ?? "—" }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Stock en depósito</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 cursor-pointer rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          {open ? "Cerrar" : "+ Cargar stock"}
        </button>
      </div>

      {open && (
        <form
          key={formKey}
          action={formAction}
          className="flex flex-col gap-3 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Producto</label>
            <select
              name="product_id"
              required
              className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Seleccionar...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:w-32">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Toneladas</label>
            <input
              type="number"
              name="cantidad"
              min="0.01"
              step="0.01"
              required
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
              Nota (opcional)
            </label>
            <input
              type="text"
              name="nota"
              placeholder="Ej. sobrante turno T-00023"
              className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-btm-navy px-5 py-2 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Cargar"}
          </button>
        </form>
      )}

      {state && "error" in state && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-4 py-3 text-sm font-semibold text-green-950">
          Stock cargado correctamente.
        </p>
      )}

      {nonZero.length === 0 ? (
        <p className="text-sm text-btm-black/50">No hay stock precargado todavía.</p>
      ) : (
        <div className="flex flex-col divide-y divide-black/5 rounded-md border border-black/10 bg-white">
          {nonZero.map((b) => (
            <div key={b.productId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="truncate text-btm-black/80">{b.productName}</span>
              <span className="btm-fig shrink-0 font-semibold text-btm-navy">{formatCantidad(b.cantidad)} tn</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
