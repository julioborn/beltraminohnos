"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { createOrderNote } from "@/lib/actions/order-notes";
import { PACKAGING_TYPES, PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";

type Option = { id: string; name: string };
type Zone = { id: string; code: string; name: string };

type Item = {
  key: string;
  productId: string;
  tipoEnvase: PackagingType;
  cantidad: string;
};

function emptyItem(): Item {
  return { key: crypto.randomUUID(), productId: "", tipoEnvase: "BOLSA", cantidad: "" };
}

export function OrderForm({
  products,
  zones,
  vendedores,
  choferes,
  priceMap,
  clientSuggestions,
}: {
  products: Option[];
  zones: Zone[];
  vendedores: Option[];
  choferes: Option[];
  priceMap: Record<string, number | null>;
  clientSuggestions: string[];
}) {
  const [state, action, pending] = useActionState(createOrderNote, undefined);
  const [zonaId, setZonaId] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const clientListId = useId();

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  function priceFor(item: Item) {
    if (!item.productId || !zonaId) return null;
    return priceMap[`${item.productId}_${item.tipoEnvase}_${zonaId}`] ?? null;
  }

  const itemsPayload = useMemo(
    () =>
      items
        .filter((it) => it.productId && it.cantidad)
        .map((it) => ({
          product_id: it.productId,
          tipo_envase: it.tipoEnvase,
          cantidad: Number(it.cantidad),
          precio_unitario: priceFor(it) ?? 0,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, zonaId],
  );

  const total = itemsPayload.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} />

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="cliente" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Cliente
          </label>
          <input
            id="cliente"
            name="cliente"
            required
            list={clientListId}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
          <datalist id={clientListId}>
            {clientSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="zona_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Zona
          </label>
          <select
            id="zona_id"
            name="zona_id"
            required
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Seleccionar...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dia_entrega" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Día de entrega
          </label>
          <input
            id="dia_entrega"
            name="dia_entrega"
            placeholder="Ej: Viernes 03"
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="vendedor_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Vendedor
          </label>
          <select
            id="vendedor_id"
            name="vendedor_id"
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Sin asignar</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="chofer_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Chofer
          </label>
          <select
            id="chofer_id"
            name="chofer_id"
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Sin asignar</option>
            {choferes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="observaciones" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Observaciones
        </label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Productos</h2>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar producto
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const price = priceFor(item);
            const cantidad = Number(item.cantidad) || 0;
            return (
              <div
                key={item.key}
                className="grid grid-cols-1 items-end gap-2 rounded-md border border-black/10 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    Producto
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                    className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    Envase
                  </label>
                  <select
                    value={item.tipoEnvase}
                    onChange={(e) => updateItem(item.key, { tipoEnvase: e.target.value as PackagingType })}
                    className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                  >
                    {PACKAGING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PACKAGING_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.cantidad}
                    onChange={(e) => updateItem(item.key, { cantidad: e.target.value })}
                    className="rounded-md border border-black/15 px-2 py-1.5 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    Precio USD/kg
                  </span>
                  <span className="px-2 py-1.5 text-sm">
                    {price === null ? (
                      <span className="text-btm-red">Sin precio</span>
                    ) : (
                      `$${price.toFixed(3)} · $${(price * cantidad).toFixed(2)}`
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="justify-self-start rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10 sm:justify-self-center"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-right font-display text-sm font-bold text-btm-navy">
          Total: ${total.toFixed(2)}
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar nota"}
      </button>
    </form>
  );
}
