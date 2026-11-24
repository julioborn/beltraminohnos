"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearZona, actualizarZona } from "@/lib/actions/zones";

export type ZonaInicial = { id: string; code: string; name: string; sort_order: number };

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

export function ZonaForm({ zona, onDone }: { zona?: ZonaInicial; onDone?: () => void }) {
  const action = zona ? actualizarZona : crearZona;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [code, setCode] = useState(zona?.code ?? "");
  const [name, setName] = useState(zona?.name ?? "");
  const [sortOrder, setSortOrder] = useState(zona ? String(zona.sort_order) : "");
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      setCode("");
      setName("");
      setSortOrder("");
      onDone?.();
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {zona && <input type="hidden" name="id" value={zona.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Código</label>
          <input name="code" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
          <p className="text-[11px] text-btm-black/50">Lo que aparece en las columnas del Excel de precios (ej. &quot;Concep&quot;).</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Nombre</label>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Orden</label>
          <input type="number" name="sort_order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputClass} />
          <p className="text-[11px] text-btm-black/50">Define en qué posición aparece esta zona en las listas (opcional).</p>
        </div>
      </div>

      {state?.error && <p className="text-sm font-medium text-btm-red">{state.error}</p>}
      {success && (
        <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-3 py-2 text-xs font-semibold text-green-950">
          Zona guardada.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : zona ? "Guardar cambios" : "Crear zona"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-black/15 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
