"use client";

import { useState } from "react";
import { finalizarTurno } from "@/lib/actions/produccion";

export function FinalizarTurnoButton({ turnoId }: { turnoId: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red"
      >
        Finalizar turno
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-btm-navy/30 bg-btm-navy/5 p-3">
      <p className="text-xs text-btm-navy">
        ¿Seguro que querés finalizar este turno? Una vez finalizado no se va a poder editar más.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="flex-1 rounded-full border border-black/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
        >
          Cancelar
        </button>
        <form action={finalizarTurno} className="flex-1">
          <input type="hidden" name="turno_id" value={turnoId} />
          <button
            type="submit"
            className="w-full rounded-full bg-btm-navy px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red"
          >
            Sí, finalizar
          </button>
        </form>
      </div>
    </div>
  );
}
