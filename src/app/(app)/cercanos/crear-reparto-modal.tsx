"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createReparto } from "@/lib/actions/repartos";
import type { NearbyOrder } from "./nearby-results";

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

export function CrearRepartoModal({
  orders,
  choferes,
  camiones,
  onClose,
}: {
  orders: NearbyOrder[];
  choferes: Chofer[];
  camiones: Camion[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createReparto, undefined);
  const [choferId, setChoferId] = useState("");
  const [selectedCamionIds, setSelectedCamionIds] = useState<string[]>([]);

  function handleChoferChange(newChoferId: string) {
    setChoferId(newChoferId);
    setSelectedCamionIds(camiones.filter((c) => c.chofer_id === newChoferId).map((c) => c.id));
  }

  function toggleCamion(camionId: string) {
    setSelectedCamionIds((prev) =>
      prev.includes(camionId) ? prev.filter((id) => id !== camionId) : [...prev, camionId],
    );
  }

  const camionesDelChofer = useMemo(
    () => camiones.filter((c) => c.chofer_id === choferId),
    [camiones, choferId],
  );
  const otrosCamiones = useMemo(
    () => camiones.filter((c) => c.chofer_id !== choferId),
    [camiones, choferId],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="btm-card flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-navy">Crear reparto</h2>
            <p className="text-sm text-btm-black/60">
              {orders.length} nota{orders.length === 1 ? "" : "s"} seleccionada{orders.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/60 hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>

        <div className="flex max-h-56 flex-col divide-y divide-black/5 overflow-y-auto rounded-md border border-black/10">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="font-semibold text-btm-navy">{o.numero}</span>
              <span className="truncate text-btm-black/70">{o.cliente}</span>
            </div>
          ))}
        </div>

        <form action={action} className="flex flex-col gap-4">
          {orders.map((o) => (
            <input key={o.id} type="hidden" name="order_note_id" value={o.id} />
          ))}

          <div className="flex flex-col gap-1">
            <label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              placeholder="Ej: Reparto zona norte"
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
              placeholder="Opcional"
              className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            />
          </div>

          <div className="flex flex-col gap-1">
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
              <div className="flex max-h-52 flex-col gap-2 overflow-y-auto rounded-md border border-black/10 p-2">
                {camionesDelChofer.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-btm-black/40">
                      Del chofer elegido
                    </span>
                    {camionesDelChofer.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5"
                      >
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
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/5"
                      >
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
              {pending ? "Creando..." : "Crear reparto"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="cursor-pointer rounded-full border border-black/15 px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
