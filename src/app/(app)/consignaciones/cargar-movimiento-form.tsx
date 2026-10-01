"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearMovimientoSucursal } from "@/lib/actions/consignaciones";

type Option = { id: string; name: string };

// Para contable/admin: igual que el formulario de "Mi sucursal", pero con
// selector de sucursal — para cargar movimientos atrasados de cualquiera
// (ej. historial que todavía no estaba en el sistema), no solo la propia.
export function CargarMovimientoAdminForm({ sucursales, products }: { sucursales: Option[]; products: Option[] }) {
  const [state, formAction, pending] = useActionState(crearMovimientoSucursal, undefined);
  const [tipo, setTipo] = useState("VENTA");
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setFormKey((k) => k + 1);
      setTipo("VENTA");
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 text-left"
      >
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Cargar movimiento (cualquier sucursal, incluye fechas pasadas)
        </h2>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-btm-navy">
          {open ? "Cerrar" : "Abrir"}
        </span>
      </button>

      {open && (
        <form key={formKey} action={formAction} className="flex flex-col gap-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
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

            <div className="flex flex-col gap-1">
              <label htmlFor="product_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Producto
              </label>
              <select
                id="product_id"
                name="product_id"
                required
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              >
                <option value="">Seleccionar...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="cantidad_bolsas" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Cantidad de bolsas
              </label>
              <input
                id="cantidad_bolsas"
                name="cantidad_bolsas"
                type="number"
                min="1"
                step="1"
                required
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              />
            </div>
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
            disabled={pending}
            className="self-start rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Cargar movimiento"}
          </button>
        </form>
      )}
    </section>
  );
}
