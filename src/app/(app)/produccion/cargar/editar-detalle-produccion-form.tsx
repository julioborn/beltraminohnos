"use client";

import { useActionState, useState } from "react";
import { actualizarDetalleProduccion } from "@/lib/actions/produccion";

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{label}</label>
      {children}
    </div>
  );
}

type Inicial = {
  tipoEnvase: string | null;
  rotuloBolsas: string | null;
};

export function EditarDetalleProduccionForm({ produccionId, inicial }: { produccionId: string; inicial: Inicial }) {
  const [state, formAction, pending] = useActionState(actualizarDetalleProduccion, undefined);
  const [tipoEnvase, setTipoEnvase] = useState(inicial.tipoEnvase ?? "BOLSA");
  const [rotuloBolsas, setRotuloBolsas] = useState(inicial.rotuloBolsas ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="produccion_id" value={produccionId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Envase">
          <select value={tipoEnvase} onChange={(e) => setTipoEnvase(e.target.value)} name="tipo_envase" className={inputClass}>
            <option value="BOLSA">Bolsa</option>
            <option value="GRANEL">Granel</option>
            <option value="BIG_BAG">Big bag</option>
          </select>
        </Field>
        {tipoEnvase === "BOLSA" && (
          <Field label="Rótulo bolsas">
            <input type="text" name="rotulo_bolsas" value={rotuloBolsas} onChange={(e) => setRotuloBolsas(e.target.value)} className={inputClass} />
          </Field>
        )}
      </div>

      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-btm-navy px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
