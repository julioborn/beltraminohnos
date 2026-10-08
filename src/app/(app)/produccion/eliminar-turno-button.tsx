"use client";

import { useState } from "react";
import { eliminarTurno } from "@/lib/actions/produccion";

export function EliminarTurnoButton({ turnoId }: { turnoId: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-btm-red px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red hover:text-white"
      >
        Borrar turno
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-btm-red/30 bg-btm-red/5 p-3">
      <p className="text-xs text-btm-red">¿Seguro que querés borrar este turno? No se puede deshacer.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="flex-1 rounded-full border border-black/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
        >
          Cancelar
        </button>
        <form action={eliminarTurno} className="flex-1">
          <input type="hidden" name="turno_id" value={turnoId} />
          <button
            type="submit"
            className="w-full rounded-full bg-btm-red px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy"
          >
            Sí, borrar
          </button>
        </form>
      </div>
    </div>
  );
}
