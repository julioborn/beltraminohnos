"use client";

import { useActionState, useState } from "react";
import { actualizarCiclosProduccion } from "@/lib/actions/produccion";
import { CiclosGrid } from "./ciclos-grid";

export function EditarCiclosForm({
  produccionId,
  ciclosIniciales,
}: {
  produccionId: string;
  ciclosIniciales: number;
}) {
  const [state, formAction, pending] = useActionState(actualizarCiclosProduccion, undefined);
  const [ciclos, setCiclos] = useState(String(ciclosIniciales));

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="produccion_id" value={produccionId} />
      <input type="hidden" name="ciclos_completados" value={ciclos} />
      <CiclosGrid value={ciclos} onChange={setCiclos} />
      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || Number(ciclos) === ciclosIniciales}
        className="self-start rounded-full bg-btm-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar ciclos"}
      </button>
    </form>
  );
}
