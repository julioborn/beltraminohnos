"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { agregarParada, eliminarParada } from "@/lib/actions/produccion";

type Parada = { id: string; tipo: string; detalle: string | null; minutos: number | null };

const PARADA_LABELS: Record<string, string> = {
  ROTURA: "Rotura",
  CORTE_LUZ: "Corte de luz",
  FALTA_MATERIA_PRIMA: "Falta de materia prima",
  OTROS: "Otros",
};

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{label}</label>
      {children}
    </div>
  );
}

export function ParadasEditor({ turnoId, paradas }: { turnoId: string; paradas: Parada[] }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [state, formAction, pending] = useActionState(agregarParada, undefined);
  const [tipo, setTipo] = useState("ROTURA");
  const [detalle, setDetalle] = useState("");
  const [minutos, setMinutos] = useState("");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setTipo("ROTURA");
      setDetalle("");
      setMinutos("");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <div className="flex flex-col gap-3">
      {paradas.length === 0 ? (
        <p className="text-sm text-btm-black/50">Sin paradas cargadas.</p>
      ) : (
        <div className="flex flex-col divide-y divide-black/5">
          {paradas.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-btm-navy">{PARADA_LABELS[p.tipo] ?? p.tipo}</span>
                <span className="text-btm-black/70">
                  {[p.minutos != null ? `${p.minutos} min` : null, p.detalle].filter(Boolean).join(" · ")}
                </span>
              </div>
              <form action={eliminarParada}>
                <input type="hidden" name="parada_id" value={p.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                >
                  Quitar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {mostrarForm ? (
        <form action={formAction} className="flex flex-col gap-2 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end">
          <input type="hidden" name="turno_id" value={turnoId} />
          <div className="w-full sm:w-48">
            <Field label="Tipo">
              <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
                {Object.entries(PARADA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Detalle">
              <input type="text" name="detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="w-full sm:w-28">
            <Field label="Minutos">
              <input type="number" min="0" name="minutos" value={minutos} onChange={(e) => setMinutos(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Agregar"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          + Agregar parada
        </button>
      )}
      {state?.error && <p className="text-xs font-medium text-btm-red">{state.error}</p>}
    </div>
  );
}
