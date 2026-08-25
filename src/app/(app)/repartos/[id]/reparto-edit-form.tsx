"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { UpdateRepartoState } from "@/lib/actions/repartos";

type Chofer = { id: string; name: string };
type Camion = {
  id: string;
  dominio: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  chofer_id: string | null;
};

export type RepartoInitial = {
  nombre: string;
  descripcion: string;
  choferId: string;
  camionIds: string[];
};

export function RepartoEditForm({
  action,
  choferes,
  camiones,
  initial,
  onCancel,
  onSaved,
}: {
  action: (prevState: UpdateRepartoState, formData: FormData) => Promise<UpdateRepartoState>;
  choferes: Chofer[];
  camiones: Camion[];
  initial: RepartoInitial;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [choferId, setChoferId] = useState(initial.choferId);
  const [selectedCamionIds, setSelectedCamionIds] = useState<string[]>(initial.camionIds);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSaved();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  function handleChoferChange(newChoferId: string) {
    setChoferId(newChoferId);
    setSelectedCamionIds(camiones.filter((c) => c.chofer_id === newChoferId).map((c) => c.id));
  }

  function toggleCamion(camionId: string) {
    setSelectedCamionIds((prev) =>
      prev.includes(camionId) ? prev.filter((id) => id !== camionId) : [...prev, camionId],
    );
  }

  const camionesDelChofer = useMemo(() => camiones.filter((c) => c.chofer_id === choferId), [camiones, choferId]);
  const otrosCamiones = useMemo(() => camiones.filter((c) => c.chofer_id !== choferId), [camiones, choferId]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={initial.nombre}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={initial.descripcion}
          placeholder="Opcional"
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>

      <div className="flex flex-col gap-1 sm:w-64">
        <label htmlFor="chofer_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Chofer
        </label>
        <select
          id="chofer_id"
          name="chofer_id"
          value={choferId}
          onChange={(e) => handleChoferChange(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        >
          <option value="">Sin asignar</option>
          {choferes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {camiones.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Flota</span>
          <div className="flex max-h-52 flex-col gap-2 overflow-y-auto rounded-md border border-black/10 p-2 sm:max-w-sm">
            {camionesDelChofer.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-btm-black/40">
                  Del chofer elegido
                </span>
                {camionesDelChofer.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5">
                    <input
                      type="checkbox"
                      name="camion_id"
                      value={c.id}
                      checked={selectedCamionIds.includes(c.id)}
                      onChange={() => toggleCamion(c.id)}
                      className="h-4 w-4 cursor-pointer accent-btm-navy"
                    />
                    <span>
                      {c.dominio} · {c.tipo}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {otrosCamiones.length > 0 && (
              <div className="flex flex-col gap-1">
                {camionesDelChofer.length > 0 && (
                  <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-btm-black/40">
                    Resto de la flota
                  </span>
                )}
                {otrosCamiones.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5">
                    <input
                      type="checkbox"
                      name="camion_id"
                      value={c.id}
                      checked={selectedCamionIds.includes(c.id)}
                      onChange={() => toggleCamion(c.id)}
                      className="h-4 w-4 cursor-pointer accent-btm-navy"
                    />
                    <span>
                      {c.dominio} · {c.tipo}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="cursor-pointer rounded-full border border-black/15 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
