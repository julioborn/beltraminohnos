"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registrarContinuacionEmbolsado } from "@/lib/actions/produccion";
import { formatFecha } from "@/lib/format";

type Pendiente = {
  produccionId: string;
  formulaCodigo: string;
  formulaNombre: string;
  turnoNumero: string;
  turnoFecha: string;
  pendienteKg: number;
};

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function PendienteRow({ turnoId, pendiente }: { turnoId: string; pendiente: Pendiente }) {
  const [state, formAction, pending] = useActionState(registrarContinuacionEmbolsado, undefined);
  const [kg, setKg] = useState("");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setKg("");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-black/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-btm-navy">
          {pendiente.formulaCodigo} · {pendiente.formulaNombre}
        </span>
        <span className="text-xs text-btm-black/50">
          Del turno {pendiente.turnoNumero} ({formatFecha(pendiente.turnoFecha)})
        </span>
      </div>
      <p className="text-sm text-btm-black/70">
        Pendiente de embolsar: <span className="font-semibold text-btm-navy">{pendiente.pendienteKg.toLocaleString("es-AR")} kg</span>
      </p>
      <form action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="turno_id" value={turnoId} />
        <input type="hidden" name="produccion_origen_id" value={pendiente.produccionId} />
        <div className="flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Kg embolsados ahora</label>
          <input
            type="number"
            min="0"
            name="kg_embolsado"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !kg}
          className="shrink-0 rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Registrar"}
        </button>
      </form>
      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}
    </div>
  );
}

export function PendientesEmbolsar({ turnoId, pendientes }: { turnoId: string; pendientes: Pendiente[] }) {
  if (pendientes.length === 0) return null;
  return (
    <section className="btm-card flex flex-col gap-3 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Pendiente de embolsar</h2>
      <p className="text-xs text-btm-black/50">
        Productos en modalidad Bolsa que quedaron sin terminar de embolsar en turnos anteriores.
      </p>
      <div className="flex flex-col gap-2">
        {pendientes.map((p) => (
          <PendienteRow key={p.produccionId} turnoId={turnoId} pendiente={p} />
        ))}
      </div>
    </section>
  );
}
