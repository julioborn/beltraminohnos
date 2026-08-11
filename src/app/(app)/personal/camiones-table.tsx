"use client";

import { useActionState, useState, useTransition } from "react";
import { createCamion, updateCamion, setCamionActive, deleteCamion } from "@/lib/actions/camiones";

type Chofer = { id: string; name: string };
type Camion = {
  id: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  dominio: string;
  chofer_id: string | null;
  active: boolean;
};

type EditableFields = { tipo: string; marca_modelo: string; anio: string; empresa: string; dominio: string; chofer_id: string };

function toEditable(c: Camion): EditableFields {
  return {
    tipo: c.tipo,
    marca_modelo: c.marca_modelo ?? "",
    anio: c.anio?.toString() ?? "",
    empresa: c.empresa ?? "",
    dominio: c.dominio,
    chofer_id: c.chofer_id ?? "",
  };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function CamionesTable({ camiones, choferes }: { camiones: Camion[]; choferes: Chofer[] }) {
  const [createState, createAction, createPending] = useActionState(createCamion, undefined);
  const [edits, setEdits] = useState<Record<string, EditableFields>>(() =>
    Object.fromEntries(camiones.map((c) => [c.id, toEditable(c)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const choferName = (id: string | null) => choferes.find((c) => c.id === id)?.name ?? "Sin asignar";

  function startEdit(camion: Camion) {
    setEdits((prev) => ({ ...prev, [camion.id]: toEditable(camion) }));
    setEditingId(camion.id);
    setConfirmDeleteId(null);
  }

  function cancelEdit(camion: Camion) {
    setEdits((prev) => ({ ...prev, [camion.id]: toEditable(camion) }));
    setEditingId(null);
  }

  function saveEdit(camion: Camion) {
    const e = edits[camion.id];
    if (!e.dominio.trim() || !e.tipo.trim()) return;
    setSavingId(camion.id);
    startTransition(async () => {
      await updateCamion(camion.id, {
        tipo: e.tipo.trim().toUpperCase(),
        marca_modelo: e.marca_modelo.trim() || null,
        anio: e.anio.trim() ? Number(e.anio.trim()) : null,
        empresa: e.empresa.trim() ? e.empresa.trim().toUpperCase() : null,
        dominio: e.dominio.trim().toUpperCase(),
        chofer_id: e.chofer_id || null,
      });
      setSavingId(null);
      setEditingId(null);
    });
  }

  function handleToggleActive(camionId: string, active: boolean) {
    startTransition(() => {
      setCamionActive(camionId, active);
    });
  }

  function askDelete(camionId: string) {
    setConfirmDeleteId(camionId);
    setEditingId(null);
    setDeleteError(null);
  }

  function handleDelete(camion: Camion) {
    setDeletingId(camion.id);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCamion(camion.id);
      setDeletingId(null);
      if (result?.error) {
        setDeleteError({ id: camion.id, message: result.error });
      } else {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={createAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="dominio" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Dominio</label>
          <input id="dominio" name="dominio" required placeholder="Ej: AB123CD" className="w-32 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Tipo</label>
          <input id="tipo" name="tipo" required placeholder="Ej: CHASIS" className="w-32 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="marca_modelo" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Marca / modelo</label>
          <input id="marca_modelo" name="marca_modelo" placeholder="Ej: VOLKSVAGUEN 17280 E" className="w-52 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="anio" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Año</label>
          <input id="anio" name="anio" type="number" placeholder="Ej: 2020" className="w-24 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="empresa" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Empresa</label>
          <input id="empresa" name="empresa" placeholder="Ej: TSP" className="w-24 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="chofer_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Chofer</label>
          <select id="chofer_id" name="chofer_id" defaultValue="" className="w-44 rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy">
            <option value="">Sin asignar</option>
            {choferes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={createPending}
          className="cursor-pointer rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red disabled:opacity-60"
        >
          {createPending ? "Agregando..." : "Agregar"}
        </button>
      </form>
      {createState?.error && <p className="text-sm font-medium text-btm-red">{createState.error}</p>}

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 lg:hidden">
        {camiones.map((camion) => {
          const isEditing = editingId === camion.id;
          const isConfirmingDelete = confirmDeleteId === camion.id;
          const e = edits[camion.id];
          return (
            <div key={camion.id} className={`flex flex-col gap-2 rounded-lg border border-black/10 p-3 ${camion.active ? "" : "opacity-50"}`}>
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={e.dominio} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], dominio: ev.target.value } }))} placeholder="Dominio" className="rounded-md border border-btm-navy px-2 py-1.5 text-sm" />
                    <input value={e.tipo} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], tipo: ev.target.value } }))} placeholder="Tipo" className="rounded-md border border-btm-navy px-2 py-1.5 text-sm" />
                    <input value={e.marca_modelo} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], marca_modelo: ev.target.value } }))} placeholder="Marca / modelo" className="col-span-2 rounded-md border border-btm-navy px-2 py-1.5 text-sm" />
                    <input value={e.anio} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], anio: ev.target.value } }))} placeholder="Año" type="number" className="rounded-md border border-btm-navy px-2 py-1.5 text-sm" />
                    <input value={e.empresa} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], empresa: ev.target.value } }))} placeholder="Empresa" className="rounded-md border border-btm-navy px-2 py-1.5 text-sm" />
                    <select value={e.chofer_id} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], chofer_id: ev.target.value } }))} className="col-span-2 rounded-md border border-btm-navy px-2 py-1.5 text-sm">
                      <option value="">Sin asignar</option>
                      {choferes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(camion)} disabled={savingId === camion.id} className="cursor-pointer rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60">
                      {savingId === camion.id ? "Guardando..." : "Guardar"}
                    </button>
                    <button type="button" onClick={() => cancelEdit(camion)} className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : isConfirmingDelete ? (
                <>
                  <p className="text-sm text-btm-black/70">¿Eliminar &ldquo;{camion.dominio}&rdquo;?</p>
                  {deleteError?.id === camion.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleDelete(camion)} disabled={deletingId === camion.id} className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60">
                      {deletingId === camion.id ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{camion.dominio} · {camion.tipo}</p>
                      <p className="text-xs text-btm-black/60">{camion.marca_modelo}{camion.anio ? ` (${camion.anio})` : ""}{camion.empresa ? ` · ${camion.empresa}` : ""}</p>
                      <p className="text-xs text-btm-black/50">Chofer: {choferName(camion.chofer_id)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button type="button" onClick={() => startEdit(camion)} title="Editar" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy">
                        <PencilIcon />
                      </button>
                      <button type="button" onClick={() => askDelete(camion.id)} title="Eliminar" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-red hover:text-btm-red">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(camion.id, !camion.active)}
                    className={`self-start cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      camion.active ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200" : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                    }`}
                  >
                    {camion.active ? "Activo" : "Inactivo"}
                  </button>
                </>
              )}
            </div>
          );
        })}
        {camiones.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">No hay vehículos cargados.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-3">Dominio</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3">Marca / modelo</th>
              <th className="px-3 py-3">Año</th>
              <th className="px-3 py-3">Empresa</th>
              <th className="px-3 py-3">Chofer</th>
              <th className="w-24 px-3 py-3">Estado</th>
              <th className="w-24 px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {camiones.map((camion) => {
              const isEditing = editingId === camion.id;
              const isConfirmingDelete = confirmDeleteId === camion.id;
              const e = edits[camion.id];
              return (
                <tr key={camion.id} className={camion.active ? "" : "opacity-50"}>
                  {isEditing ? (
                    <>
                      <td className="px-2 py-1.5"><input value={e.dominio} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], dominio: ev.target.value } }))} className="w-28 rounded-md border border-btm-navy px-2 py-1.5 text-sm" /></td>
                      <td className="px-2 py-1.5"><input value={e.tipo} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], tipo: ev.target.value } }))} className="w-28 rounded-md border border-btm-navy px-2 py-1.5 text-sm" /></td>
                      <td className="px-2 py-1.5"><input value={e.marca_modelo} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], marca_modelo: ev.target.value } }))} className="w-48 rounded-md border border-btm-navy px-2 py-1.5 text-sm" /></td>
                      <td className="px-2 py-1.5"><input value={e.anio} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], anio: ev.target.value } }))} type="number" className="w-20 rounded-md border border-btm-navy px-2 py-1.5 text-sm" /></td>
                      <td className="px-2 py-1.5"><input value={e.empresa} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], empresa: ev.target.value } }))} className="w-20 rounded-md border border-btm-navy px-2 py-1.5 text-sm" /></td>
                      <td className="px-2 py-1.5">
                        <select value={e.chofer_id} onChange={(ev) => setEdits((p) => ({ ...p, [camion.id]: { ...p[camion.id], chofer_id: ev.target.value } }))} className="w-40 rounded-md border border-btm-navy px-2 py-1.5 text-sm">
                          <option value="">Sin asignar</option>
                          {choferes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-btm-black/40">—</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => saveEdit(camion)} disabled={savingId === camion.id} className="cursor-pointer rounded-full bg-btm-navy px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60">
                            {savingId === camion.id ? "..." : "OK"}
                          </button>
                          <button type="button" onClick={() => cancelEdit(camion)} className="cursor-pointer rounded-full border border-black/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5">
                            X
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{camion.dominio}</td>
                      <td className="px-3 py-2">{camion.tipo}</td>
                      <td className="px-3 py-2 text-btm-black/70">{camion.marca_modelo}</td>
                      <td className="px-3 py-2 text-btm-black/70">{camion.anio ?? "—"}</td>
                      <td className="px-3 py-2 text-btm-black/70">{camion.empresa ?? "—"}</td>
                      <td className="px-3 py-2 text-btm-black/70">{choferName(camion.chofer_id)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(camion.id, !camion.active)}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                            camion.active ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200" : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                          }`}
                        >
                          {camion.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        {isConfirmingDelete ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <button type="button" onClick={() => handleDelete(camion)} disabled={deletingId === camion.id} className="cursor-pointer rounded-full bg-btm-red px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60">
                                {deletingId === camion.id ? "..." : "Sí"}
                              </button>
                              <button type="button" onClick={() => setConfirmDeleteId(null)} className="cursor-pointer rounded-full border border-black/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5">
                                No
                              </button>
                            </div>
                            {deleteError?.id === camion.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button type="button" onClick={() => startEdit(camion)} title="Editar" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy">
                              <PencilIcon />
                            </button>
                            <button type="button" onClick={() => askDelete(camion.id)} title="Eliminar" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-red hover:text-btm-red">
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {camiones.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-btm-black/50">No hay vehículos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
