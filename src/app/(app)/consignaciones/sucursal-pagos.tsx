"use client";

// Pagos sueltos que cada sucursal le va entregando a BTM, a medida que los
// va haciendo — nunca atados a una venta o factura puntual (ver el
// comentario en cargarSucursalPago). Contable los carga acá para que el
// "Pagado"/"Saldo" de la pestaña de Saldo coincida con el sistema contable.

import { useActionState, useEffect, useRef, useState } from "react";
import { cargarSucursalPago, eliminarSucursalPago } from "@/lib/actions/consignaciones";

type Option = { id: string; name: string };

export function CargarPagoForm({ sucursales }: { sucursales: Option[] }) {
  const [state, formAction, pending] = useActionState(cargarSucursalPago, undefined);
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setFormKey((k) => k + 1);
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center justify-between gap-2 text-left">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Cargar pago</h2>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-btm-navy">{open ? "Cerrar" : "Abrir"}</span>
      </button>

      {open && (
        <form key={formKey} action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="pago_sucursal_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Sucursal
              </label>
              <select
                id="pago_sucursal_id"
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
              <label htmlFor="pago_fecha" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Fecha
              </label>
              <input
                id="pago_fecha"
                name="fecha"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="pago_importe" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Importe ARS
              </label>
              <input
                id="pago_importe"
                name="importe_ars"
                type="number"
                min="0.01"
                step="0.01"
                required
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pago_formato" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Formato de pago
              </label>
              <select
                id="pago_formato"
                name="formato_pago"
                defaultValue=""
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              >
                <option value="">Seleccionar...</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="pago_comprobante" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Comprobante
              </label>
              <input
                id="pago_comprobante"
                name="comprobante"
                type="text"
                placeholder="N° de comprobante (opcional)"
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pago_observaciones" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
                Observaciones
              </label>
              <input
                id="pago_observaciones"
                name="observaciones"
                type="text"
                placeholder="Opcional"
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              />
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="text-sm font-medium text-btm-red">
              {state.error}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-4 py-3 text-sm font-semibold text-green-950">
              Pago cargado correctamente.
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Cargar pago"}
          </button>
        </form>
      )}
    </section>
  );
}

export function BorrarPagoButton({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md border border-btm-red/30 px-3 py-1 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
      >
        Borrar
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <span className="text-[11px] text-btm-red">¿Seguro?</span>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="rounded-md border border-black/15 px-2 py-1 text-xs font-semibold text-btm-black/70 hover:bg-black/5"
      >
        Cancelar
      </button>
      <form action={eliminarSucursalPago}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="rounded-md bg-btm-red px-2 py-1 text-xs font-semibold text-white hover:bg-btm-navy">
          Sí, borrar
        </button>
      </form>
    </div>
  );
}
