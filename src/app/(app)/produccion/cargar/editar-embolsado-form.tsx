"use client";

import { useActionState, useState } from "react";
import { actualizarEmbolsado } from "@/lib/actions/produccion";

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

export function EditarEmbolsadoForm({
  produccionId,
  bolsasEmbolsadasInicial,
}: {
  produccionId: string;
  bolsasEmbolsadasInicial: number | null;
}) {
  const [state, formAction, pending] = useActionState(actualizarEmbolsado, undefined);
  const [bolsasEmbolsadas, setBolsasEmbolsadas] = useState(
    bolsasEmbolsadasInicial != null ? String(bolsasEmbolsadasInicial) : "",
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="produccion_id" value={produccionId} />
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">Bolsas embolsadas</label>
      <div className="flex items-end gap-2">
        <input
          type="number"
          min="0"
          name="bolsas_embolsadas"
          value={bolsasEmbolsadas}
          onChange={(e) => setBolsasEmbolsadas(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending || Number(bolsasEmbolsadas || 0) === (bolsasEmbolsadasInicial ?? 0)}
          className="shrink-0 rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}
    </form>
  );
}
