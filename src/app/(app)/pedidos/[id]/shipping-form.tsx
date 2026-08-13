"use client";

import { useState } from "react";
import { formatDiaEntrega } from "@/lib/format";

type Chofer = { id: string; name: string };
type Camion = { id: string; dominio: string; tipo: string; chofer_id: string | null };

export function ShippingForm({
  action,
  choferes,
  choferId,
  camiones,
  camionId,
  fechaEntrega: initialFechaEntrega,
  fechaEnvio,
  observaciones,
}: {
  action: (formData: FormData) => void;
  choferes: Chofer[];
  choferId: string;
  camiones: Camion[];
  camionId: string;
  fechaEntrega: string;
  fechaEnvio: string;
  observaciones: string;
}) {
  const [fechaEntrega, setFechaEntrega] = useState(initialFechaEntrega);
  const [fechaEnvioValue, setFechaEnvioValue] = useState(fechaEnvio);
  const [selectedChoferId, setSelectedChoferId] = useState(choferId);
  const [selectedCamionId, setSelectedCamionId] = useState(camionId);

  function handleCamionChange(newCamionId: string) {
    setSelectedCamionId(newCamionId);
    const camion = camiones.find((c) => c.id === newCamionId);
    if (camion?.chofer_id) {
      setSelectedChoferId(camion.chofer_id);
    }
  }

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Flota</label>
        <select
          name="camion_id"
          value={selectedCamionId}
          onChange={(e) => handleCamionChange(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        >
          <option value="">Sin asignar</option>
          {camiones.map((c) => (
            <option key={c.id} value={c.id}>{c.dominio} · {c.tipo}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Chofer</label>
        <select
          name="chofer_id"
          value={selectedChoferId}
          onChange={(e) => setSelectedChoferId(e.target.value)}
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
