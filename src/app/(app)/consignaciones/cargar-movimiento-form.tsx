"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { crearMovimientosSucursal } from "@/lib/actions/consignaciones";

type Option = { id: string; name: string };
type Item = { key: string; productId: string; cantidadBolsas: string };

function emptyItem(): Item {
  return { key: crypto.randomUUID(), productId: "", cantidadBolsas: "" };
}

// Para contable/admin: igual que el formulario de "Mi sucursal", pero con
// selector de sucursal — para cargar movimientos atrasados de cualquiera
// (ej. historial que todavía no estaba en el sistema), no solo la propia.
export function CargarMovimientoAdminForm({ sucursales, products }: { sucursales: Option[]; products: Option[] }) {
  const [state, formAction, pending] = useActionState(crearMovimientosSucursal, undefined);
  const [tipo, setTipo] = useState("VENTA");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(true);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setFormKey((k) => k + 1);
      setTipo("VENTA");
      setItems([emptyItem()]);
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  const itemsPayload = useMemo(
    () =>
      items
        .filter((it) => it.productId && it.cantidadBolsas)
        .map((it) => ({ product_id: it.productId, cantidad_bolsas: Number(it.cantidadBolsas) })),
    [items],
  );

  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 text-left"
      >
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Cargar movimiento
        </h2>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-btm-navy">
          {open ? "Cerrar" : "Abrir"}
        </span>
      </button>

      {open && (
        <form key={formKey} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="sucursal_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Sucursal
              </label>
              <select
                id="sucursal_id"
                name="sucursal_id"
                required
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              >
                <option value="">Seleccionar...</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
          </div>

          <div className="flex flex-col gap-1 sm:w-64">
            <label htmlFor="tipo_movimiento" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Tipo de movimiento
            </label>
            <select
              id="tipo_movimiento"
              name="tipo_movimiento"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="INGRESO_STOCK">Ingreso de stock</option>
              <option value="VENTA">Venta sucursal (al por menor)</option>
              <option value="DIRECTA_CLIENTE">Directa cliente (al por mayor)</option>
            </select>
          </div>

          {tipo === "DIRECTA_CLIENTE" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="cliente_nombre" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                  Cliente
                </label>
                <input
                  id="cliente_nombre"
                  name="cliente_nombre"
                  type="text"
                  required
                  className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cliente_cuit" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                  CUIT / CUIL
                </label>
                <input
                  id="cliente_cuit"
                  name="cliente_cuit"
                  type="text"
                  className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Productos</span>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
              >
                + Agregar producto
              </button>
            </div>

            {items.map((item) => (
              <div key={item.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Producto</label>
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

                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1 sm:w-32 sm:flex-initial">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Cantidad de bolsas
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidadBolsas}
                      onChange={(e) => updateItem(item.key, { cantidadBolsas: e.target.value })}
                      className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

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

          {state?.error && (
            <p role="alert" className="text-sm font-medium text-btm-red">
              {state.error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-4 py-3 text-sm font-semibold text-green-950">
              Movimiento cargado correctamente.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || itemsPayload.length === 0}
            className="self-start rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Cargar movimiento"}
          </button>
        </form>
      )}
    </section>
  );
}
