"use client";

import { useMemo, useState } from "react";
import { formatDiaEntrega } from "@/lib/format";

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

export function ShippingForm({
  action,
  choferes,
  choferId,
  camiones,
  camionIds: initialCamionIds,
  fechaEntrega: initialFechaEntrega,
  fechaEnvio,
  observaciones,
}: {
  action: (formData: FormData) => void;
  choferes: Chofer[];
  choferId: string;
  camiones: Camion[];
  camionIds: string[];
  fechaEntrega: string;
  fechaEnvio: string;
  observaciones: string;
}) {
  const [fechaEntrega, setFechaEntrega] = useState(initialFechaEntrega);
  const [fechaEnvioValue, setFechaEnvioValue] = useState(fechaEnvio);
  const [selectedChoferId, setSelectedChoferId] = useState(choferId);
  const [selectedCamionIds, setSelectedCamionIds] = useState<string[]>(initialCamionIds);

  const camionesDelChofer = useMemo(
    () => camiones.filter((c) => c.chofer_id === selectedChoferId),
    [camiones, selectedChoferId],
  );

  function handleChoferChange(newChoferId: string) {
    setSelectedChoferId(newChoferId);
    const camionesNuevoChofer = camiones.filter((c) => c.chofer_id === newChoferId);
    setSelectedCamionIds(camionesNuevoChofer.map((c) => c.id));
  }

  function toggleCamion(camionId: string) {
    setSelectedCamionIds((prev) =>
      prev.includes(camionId) ? prev.filter((id) => id !== camionId) : [...prev, camionId],
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {selectedCamionIds.map((id) => (
        <input key={id} type="hidden" name="camion_id" value={id} />
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Chofer</label>
        <select
          name="chofer_id"
          value={selectedChoferId}
          onChange={(e) => handleChoferChange(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        >
          <option value="">Sin asignar</option>
          {choferes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Fecha de entrega
          {fechaEntrega && (
            <span className="ml-1.5 font-normal normal-case text-btm-black/50">· {formatDiaEntrega(fechaEntrega)}</span>
          )}
        </label>
        <input
          type="date"
          name="fecha_entrega"
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>

      {selectedChoferId && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Flotas asociadas — marcá las que salen en esta nota
          </span>
          {camionesDelChofer.length === 0 ? (
            <p className="text-sm text-btm-black/50">Este chofer no tiene vehículos asignados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {camionesDelChofer.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3 hover:border-btm-navy"
                >
                  <input
                    type="checkbox"
                    checked={selectedCamionIds.includes(c.id)}
                    onChange={() => toggleCamion(c.id)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-btm-navy"
                  />
                  <span className="flex flex-col text-sm">
                    <span className="font-semibold">{c.dominio} · {c.tipo}</span>
                    <span className="text-xs text-btm-black/50">
                      {[c.marca_modelo, c.anio, c.empresa].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Fecha de envío
          {fechaEnvioValue && (
            <span className="ml-1.5 font-normal normal-case text-btm-black/50">· {formatDiaEntrega(fechaEnvioValue)}</span>
          )}
        </label>
        <input
          type="date"
          name="fecha_envio"
          value={fechaEnvioValue}
          onChange={(e) => setFechaEnvioValue(e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>
      <div />
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Observaciones</label>
        <textarea
          name="observaciones"
          rows={2}
          defaultValue={observaciones}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </div>
      <button
        type="submit"
        className="w-full cursor-pointer rounded-full border border-btm-navy px-5 py-2 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:col-span-2 sm:w-auto sm:self-start"
      >
        Guardar cambios
      </button>
    </form>
  );
}
