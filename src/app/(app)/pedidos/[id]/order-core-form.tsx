"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { UpdateOrderState } from "@/lib/actions/order-notes";
import { PACKAGING_TYPES, PACKAGING_LABELS, pricingPackagingType, type PackagingType } from "@/lib/packaging";
import { DestinoSelect } from "../nuevo/destino-select";
import { ClienteAutocomplete } from "../nuevo/cliente-autocomplete";

type Option = { id: string; name: string };
type Zone = { id: string; code: string; name: string };
type Cliente = { id: string; name: string };

type Item = {
  key: string;
  productId: string;
  tipoEnvase: PackagingType;
  cantidad: string;
};

export type OrderCoreInitial = {
  cliente: string;
  provincia: string;
  localidad: string;
  vendedorId: string;
  zonaId: string;
  fecha: string;
  items: { productId: string; tipoEnvase: PackagingType; cantidad: string }[];
};

function Section({ title, twoCol, children }: { title: string; twoCol?: boolean; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
      <h3 className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy">{title}</h3>
      <div className={twoCol ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-4"}>{children}</div>
    </section>
  );
}

export function OrderCoreForm({
  action,
  products,
  zones,
  vendedores,
  priceMap,
  clientes,
  initial,
  onCancel,
  onSaved,
}: {
  action: (prevState: UpdateOrderState, formData: FormData) => Promise<UpdateOrderState>;
  products: Option[];
  zones: Zone[];
  vendedores: Option[];
  priceMap: Record<string, number | null>;
  clientes: Cliente[];
  initial: OrderCoreInitial;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [zonaId, setZonaId] = useState(initial.zonaId);
  const [items, setItems] = useState<Item[]>(() =>
    initial.items.length > 0
      ? initial.items.map((it) => ({ key: crypto.randomUUID(), ...it }))
      : [{ key: crypto.randomUUID(), productId: "", tipoEnvase: "BOLSA", cantidad: "" }],
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSaved();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  function priceFor(item: Item) {
    if (!item.productId || !zonaId) return null;
    const packagingType = pricingPackagingType(item.tipoEnvase);
    return priceMap[`${item.productId}_${packagingType}_${zonaId}`] ?? null;
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
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} />

      <Section title="Cliente">
        <ClienteAutocomplete clientes={clientes} defaultValue={initial.cliente} />
      </Section>

      <Section title="Provincia y localidad" twoCol>
        <DestinoSelect defaultProvincia={initial.provincia} defaultLocalidad={initial.localidad} />
      </Section>

      <Section title="Vendedor y zona comercial" twoCol>
        <div className="flex flex-col gap-1">
          <label htmlFor="vendedor_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Vendedor
          </label>
          <select
            id="vendedor_id"
            name="vendedor_id"
            defaultValue={initial.vendedorId}
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
          <label htmlFor="zona_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Zona comercial
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
      </Section>

      <Section title="Fecha de emisión">
        <input
          id="fecha"
          name="fecha"
          type="date"
          defaultValue={initial.fecha}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy sm:w-56"
        />
      </Section>

      <Section title="Productos">
        <div className="flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { key: crypto.randomUUID(), productId: "", tipoEnvase: "BOLSA", cantidad: "" }])}
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
              <div key={item.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Producto
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(item.key, { productId: e.target.value })}
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

                  <div className="flex w-32 shrink-0 flex-col gap-1 sm:w-40">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Envase
                    </label>
                    <select
                      value={item.tipoEnvase}
                      onChange={(e) => updateItem(item.key, { tipoEnvase: e.target.value as PackagingType })}
                      className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                    >
                      {PACKAGING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {PACKAGING_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                  >
                    Quitar
                  </button>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex w-28 shrink-0 flex-col gap-1 sm:w-32">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.key, { cantidad: e.target.value })}
                      className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Precio USD/tn
                    </span>
                    <span className="px-2 py-1.5 text-sm">
                      {price === null ? (
                        <span className="text-btm-red">Sin precio</span>
                      ) : (
                        `$${price.toFixed(3)} · $${(price * cantidad).toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-right font-display text-sm font-bold text-btm-navy">Total: ${total.toFixed(2)}</p>
      </Section>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="cursor-pointer rounded-full border border-black/15 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
