"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { actualizarEstadoPlanta, quitarEstadoPlanta } from "@/lib/actions/produccion";

type Estado = {
  estado_conos_silos: string | null;
  estado_limpieza: string | null;
  operador_anterior: string | null;
  engrase_rolo_hs: string | null;
  engrase_eje_prensa_hs: string | null;
};
type Operador = { id: string; nombre: string };

const LIMPIEZA_LABELS: Record<string, string> = { B: "Bueno", R: "Regular", M: "Malo" };

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{label}</label>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</span>
      <span className="text-sm text-btm-black">{value ?? "—"}</span>
    </div>
  );
}

function hhmm(t: string | null) {
  return t ? t.slice(0, 5) : null;
}

export function EstadoPlantaEditor({ turnoId, estado, operadores }: { turnoId: string; estado: Estado; operadores: Operador[] }) {
  const tieneEstado = Boolean(
    estado.estado_conos_silos || estado.estado_limpieza || estado.operador_anterior || estado.engrase_rolo_hs || estado.engrase_eje_prensa_hs,
  );
  const [editando, setEditando] = useState(false);
  const [state, formAction, pending] = useActionState(actualizarEstadoPlanta, undefined);
  const wasPending = useRef(false);

  const [estadoConosSilos, setEstadoConosSilos] = useState(estado.estado_conos_silos ?? "");
  const [estadoLimpieza, setEstadoLimpieza] = useState(estado.estado_limpieza ?? "");
  const [operadorAnterior, setOperadorAnterior] = useState(estado.operador_anterior ?? "");
  const [engraseRoloHs, setEngraseRoloHs] = useState(estado.engrase_rolo_hs ?? "");
  const [engraseEjePrensaHs, setEngraseEjePrensaHs] = useState(estado.engrase_eje_prensa_hs ?? "");

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setEditando(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function abrirEdicion() {
    setEstadoConosSilos(estado.estado_conos_silos ?? "");
    setEstadoLimpieza(estado.estado_limpieza ?? "");
    setOperadorAnterior(estado.operador_anterior ?? "");
    setEngraseRoloHs(estado.engrase_rolo_hs ?? "");
    setEngraseEjePrensaHs(estado.engrase_eje_prensa_hs ?? "");
    setEditando(true);
  }

  if (!editando) {
    if (!tieneEstado) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-btm-black/50">Sin estado cargado.</p>
          <button
            type="button"
            onClick={abrirEdicion}
            className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar estado
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Item
            label="Estado de conos y silos"
            value={estado.estado_conos_silos === "BIEN" ? "Bien" : estado.estado_conos_silos === "GOLPEADOS" ? "Golpeados" : null}
          />
          <Item label="Estado de limpieza" value={estado.estado_limpieza ? LIMPIEZA_LABELS[estado.estado_limpieza] : null} />
          <Item label="Operador anterior" value={estado.operador_anterior} />
          <Item label="Engrase rolo" value={hhmm(estado.engrase_rolo_hs)} />
          <Item label="Engrase eje prensa" value={hhmm(estado.engrase_eje_prensa_hs)} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={abrirEdicion}
            className="rounded-full border border-btm-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            Editar
          </button>
          <form action={quitarEstadoPlanta}>
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
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="turno_id" value={turnoId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Estado de conos y silos">
          <select
            name="estado_conos_silos"
            value={estadoConosSilos}
            onChange={(e) => setEstadoConosSilos(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            <option value="BIEN">Bien</option>
            <option value="GOLPEADOS">Golpeados</option>
          </select>
        </Field>
        <Field label="Estado de limpieza recibido">
          <select
            name="estado_limpieza"
            value={estadoLimpieza}
            onChange={(e) => setEstadoLimpieza(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin especificar</option>
            <option value="B">Bueno</option>
            <option value="R">Regular</option>
            <option value="M">Malo</option>
          </select>
        </Field>
        <Field label="Operador anterior">
          <select
            name="operador_anterior"
            value={operadorAnterior}
            onChange={(e) => setOperadorAnterior(e.target.value)}
            className={inputClass}
          >
            <option value="">Seleccionar...</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.nombre}>
                {o.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Engrase rolo">
          <input
            type="time"
            name="engrase_rolo_hs"
            value={engraseRoloHs}
            onChange={(e) => setEngraseRoloHs(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Engrase eje prensa">
          <input
            type="time"
            name="engrase_eje_prensa_hs"
            value={engraseEjePrensaHs}
            onChange={(e) => setEngraseEjePrensaHs(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
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
          {pending ? "Guardando..." : "Guardar estado"}
        </button>
      </div>
    </form>
  );
}
