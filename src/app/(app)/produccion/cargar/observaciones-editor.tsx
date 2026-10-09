"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { actualizarObservaciones, quitarObservaciones } from "@/lib/actions/produccion";

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

export function ObservacionesEditor({ turnoId, observaciones }: { turnoId: string; observaciones: string | null }) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarObservaciones, undefined);
  const [texto, setTexto] = useState(observaciones ?? "");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setEditando(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function abrirEdicion() {
    setTexto(observaciones ?? "");
    setEditando(true);
  }

  if (!editando) {
    if (!observaciones) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-btm-black/50">Sin observaciones cargadas.</p>
          <button
            type="button"
            onClick={abrirEdicion}
            className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar observaciones
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-btm-black/70">{observaciones}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={abrirEdicion}
            className="rounded-full border border-btm-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Editar
          </button>
          <form action={quitarObservaciones}>
            <input type="hidden" name="turno_id" value={turnoId} />
            <button
              type="submit"
              className="rounded-full border border-btm-red px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red hover:text-white"
            >
              Quitar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="turno_id" value={turnoId} />
      <textarea
        rows={2}
        name="observaciones"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className={inputClass}
      />
      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-btm-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar observaciones"}
        </button>
      </div>
    </form>
  );
}
