"use client";

import { useEffect, useState } from "react";

type GeorefItem = { id: string; nombre: string };

export function DestinoSelect({
  defaultProvincia,
  defaultLocalidad,
}: {
  defaultProvincia?: string;
  defaultLocalidad?: string;
}) {
  const [provincias, setProvincias] = useState<GeorefItem[]>([]);
  const [localidades, setLocalidades] = useState<GeorefItem[]>([]);
  const [provinciaId, setProvinciaId] = useState("");
  const [provinciaNombre, setProvinciaNombre] = useState(defaultProvincia ?? "");
  const [localidadNombre, setLocalidadNombre] = useState(defaultLocalidad ?? "");
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);

  useEffect(() => {
    fetch("/api/georef/provincias")
      .then((r) => r.json())
      .then((data) => {
        const list: GeorefItem[] = data.provincias ?? [];
        setProvincias(list);
        if (defaultProvincia) {
          const match = list.find((p) => p.nombre === defaultProvincia);
          if (match) setProvinciaId(match.id);
        }
      })
      .catch(() => setProvincias([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!provinciaId) {
      setLocalidades([]);
      return;
    }
    setLoadingLocalidades(true);
    fetch(`/api/georef/localidades?provincia=${provinciaId}`)
      .then((r) => r.json())
      .then((data) => setLocalidades(data.localidades ?? []))
      .catch(() => setLocalidades([]))
      .finally(() => setLoadingLocalidades(false));
  }, [provinciaId]);

  return (
    <>
      <input type="hidden" name="provincia" value={provinciaNombre} />
      <input type="hidden" name="localidad" value={localidadNombre} />

      <div className="flex flex-col gap-1">
        <label htmlFor="provincia_select" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Provincia
        </label>
        <select
          id="provincia_select"
          required
          value={provinciaId}
          onChange={(e) => {
            const id = e.target.value;
            const nombre = provincias.find((p) => p.id === id)?.nombre ?? "";
            setProvinciaId(id);
            setProvinciaNombre(nombre);
            setLocalidadNombre("");
          }}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        >
          <option value="">Seleccionar...</option>
          {provincias.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="localidad_select" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
          Localidad
        </label>
        <select
          id="localidad_select"
          required
          value={localidadNombre}
          disabled={!provinciaId || loadingLocalidades}
          onChange={(e) => setLocalidadNombre(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy disabled:bg-black/5"
        >
          <option value="">
            {!provinciaId ? "Elegí una provincia primero" : loadingLocalidades ? "Cargando..." : "Seleccionar..."}
          </option>
          {localidades.map((l) => (
            <option key={l.id} value={l.nombre}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
