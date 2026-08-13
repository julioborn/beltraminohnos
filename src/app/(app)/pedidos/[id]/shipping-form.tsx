"use client";

import { useMemo, useState } from "react";
import { formatDiaEntrega } from "@/lib/format";
import { updateCamion } from "@/lib/actions/camiones";

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
  const [buscarPorFlota, setBuscarPorFlota] = useState(false);
  const [camionesState, setCamionesState] = useState<Camion[]>(camiones);
  const [camionSinChofer, setCamionSinChofer] = useState<Camion | null>(null);
  const [nuevoChoferParaCamion, setNuevoChoferParaCamion] = useState("");
  const [asignandoChofer, setAsignandoChofer] = useState(false);
  const choferNameById = useMemo(() => new Map(choferes.map((c) => [c.id, c.name])), [choferes]);

  const camionesDelChofer = useMemo(
    () => camionesState.filter((c) => c.chofer_id === selectedChoferId),
    [camionesState, selectedChoferId],
  );

  function handleChoferChange(newChoferId: string) {
    setSelectedChoferId(newChoferId);
    const camionesNuevoChofer = camionesState.filter((c) => c.chofer_id === newChoferId);
    setSelectedCamionIds(camionesNuevoChofer.map((c) => c.id));
  }

  function handleFlotaPick(camionId: string) {
    const camion = camionesState.find((c) => c.id === camionId);
    if (!camion) return;
    if (camion.chofer_id) {
      setCamionSinChofer(null);
      handleChoferChange(camion.chofer_id);
    } else {
      setCamionSinChofer(camion);
      setNuevoChoferParaCamion("");
    }
  }

  async function handleAsignarChofer() {
    if (!camionSinChofer || !nuevoChoferParaCamion) return;
    setAsignandoChofer(true);
    const result = await updateCamion(camionSinChofer.id, { chofer_id: nuevoChoferParaCamion });
    setAsignandoChofer(false);
    if (result?.error) return;

    const updatedCamiones = camionesState.map((c) =>
      c.id === camionSinChofer.id ? { ...c, chofer_id: nuevoChoferParaCamion } : c,
    );
    setCamionesState(updatedCamiones);
    setSelectedChoferId(nuevoChoferParaCamion);
    setSelectedCamionIds(updatedCamiones.filter((c) => c.chofer_id === nuevoChoferParaCamion).map((c) => c.id));
    setCamionSinChofer(null);
    setNuevoChoferParaCamion("");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-1">
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
          <button
            type="button"
            onClick={() => setBuscarPorFlota((v) => !v)}
            className={`w-full shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:w-auto ${
              buscarPorFlota
                ? "border-btm-navy bg-btm-navy text-white"
                : "border-btm-navy text-btm-navy hover:bg-btm-navy/10"
            }`}
          >
            Buscar por flota
          </button>
        </div>
        {buscarPorFlota && (
          <div className="mt-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Flota</label>
            <select
              value=""
              onChange={(e) => handleFlotaPick(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            >
              <option value="">Seleccionar...</option>
              {camionesState.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.dominio} · {c.tipo}
                  {c.chofer_id ? ` · ${choferNameById.get(c.chofer_id) ?? ""}` : " · Sin chofer"}
                </option>
              ))}
            </select>
            <p className="text-xs text-btm-black/50">Elegí una flota y se completa el chofer asociado.</p>
          </div>
        )}
        {camionSinChofer && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-btm-red/30 bg-btm-red/5 p-3">
            <p className="text-sm">
              <span className="font-semibold">{camionSinChofer.dominio} · {camionSinChofer.tipo}</span> no tiene chofer
              asignado todavía.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={nuevoChoferParaCamion}
                onChange={(e) => setNuevoChoferParaCamion(e.target.value)}
                className="flex-1 rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
              >
                <option value="">Elegir chofer...</option>
                {choferes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAsignarChofer}
                disabled={!nuevoChoferParaCamion || asignandoChofer}
                className="cursor-pointer rounded-full bg-btm-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
              >
                {asignandoChofer ? "Asignando..." : "Asignar chofer"}
              </button>
            </div>
          </div>
        )}
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
