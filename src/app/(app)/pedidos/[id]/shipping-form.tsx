"use client";

import { useState } from "react";
import { formatDiaEntrega } from "@/lib/format";

type Chofer = { id: string; name: string };

export function ShippingForm({
  action,
  choferes,
  choferId,
  fechaEntrega: initialFechaEntrega,
  fechaEnvio,
  observaciones,
}: {
  action: (formData: FormData) => void;
  choferes: Chofer[];
  choferId: string;
  fechaEntrega: string;
  fechaEnvio: string;
  observaciones: string;
}) {
  const [fechaEntrega, setFechaEntrega] = useState(initialFechaEntrega);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Chofer</label>
        <select
          name="chofer_id"
          defaultValue={choferId}
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
        <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Fecha de envío</label>
        <input
          type="date"
          name="fecha_envio"
          defaultValue={fechaEnvio}
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
        className="self-start rounded-full border border-btm-navy px-5 py-2 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white sm:col-span-2"
      >
        Guardar cambios
      </button>
    </form>
  );
}
