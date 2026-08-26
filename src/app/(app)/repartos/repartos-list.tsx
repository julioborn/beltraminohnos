"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatFecha } from "@/lib/format";
import { deleteReparto } from "@/lib/actions/repartos";
import { EditRepartoModal } from "./edit-reparto-modal";

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
type Reparto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  chofer: { id: string; name: string } | null;
  camiones: { camion_id: string }[];
  notes: { order_note_id: string }[];
};

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

export function RepartosList({
  repartos,
  choferes,
  camiones,
}: {
  repartos: Reparto[];
  choferes: Chofer[];
  camiones: Camion[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const editingReparto = repartos.find((r) => r.id === editingId) ?? null;

  function askDelete(id: string) {
    setConfirmDeleteId(id);
    setDeleteError(null);
  }

  function handleDelete(r: Reparto) {
    setDeletingId(r.id);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteReparto(r.id);
      setDeletingId(null);
      if (result?.error) setDeleteError({ id: r.id, message: result.error });
    });
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {repartos.map((r) => {
          const isConfirming = confirmDeleteId === r.id;
          return (
            <div key={r.id} className="flex flex-col gap-2 rounded-lg border border-black/10 p-4">
              <Link href={`/repartos/${r.id}`} className="flex flex-col gap-2 active:opacity-70">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-sm font-bold text-btm-navy">{r.nombre}</p>
                  <p className="btm-fig text-xs text-btm-black/50">{formatFecha(r.created_at.slice(0, 10))}</p>
                </div>
                <p className="text-xs text-btm-black/60">
                  {r.notes.length} nota{r.notes.length === 1 ? "" : "s"} · {r.camiones.length} camión
                  {r.camiones.length === 1 ? "" : "es"}
                  {r.chofer?.name ? ` · ${r.chofer.name}` : ""}
                </p>
              </Link>

              {isConfirming ? (
                <div className="flex flex-col gap-2 rounded-md border border-btm-red/30 bg-btm-red/5 p-3">
                  <p className="text-sm text-btm-black/80">
                    ¿Eliminar &ldquo;{r.nombre}&rdquo;? Esta acción no se puede deshacer.
                  </p>
                  {deleteError?.id === r.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                    >
                      {deletingId === r.id ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(r.id)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-btm-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                  >
                    <PencilIcon /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => askDelete(r.id)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-btm-red/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red/10"
                  >
                    <TrashIcon /> Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {repartos.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            Todavía no armaste ningún reparto.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Chofer</th>
              <th className="px-4 py-3">Flota</th>
              <th className="px-4 py-3">Notas</th>
              <th className="w-32 px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {repartos.map((r) => {
              const isConfirming = confirmDeleteId === r.id;
              return (
                <tr key={r.id} className="hover:bg-black/[.02]">
                  <td className="px-4 py-3 font-semibold text-btm-navy">
                    <Link href={`/repartos/${r.id}`} className="hover:text-btm-red">
                      {r.nombre}
                    </Link>
                  </td>
                  <td className="btm-fig px-4 py-3 text-btm-black/70">{formatFecha(r.created_at.slice(0, 10))}</td>
                  <td className="px-4 py-3 text-btm-black/70">{r.chofer?.name ?? "—"}</td>
                  <td className="btm-fig px-4 py-3 text-btm-black/70">{r.camiones.length}</td>
                  <td className="btm-fig px-4 py-3 text-btm-black/70">{r.notes.length}</td>
                  <td className="px-4 py-3">
                    {isConfirming ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            disabled={deletingId === r.id}
                            className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                          >
                            {deletingId === r.id ? "..." : "Sí"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                          >
                            No
                          </button>
                        </div>
                        {deleteError?.id === r.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(r.id)}
                          title="Editar"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(r.id)}
                          title="Eliminar"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-red hover:text-btm-red"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {repartos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-btm-black/50">
                  Todavía no armaste ningún reparto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingReparto && (
        <EditRepartoModal
          repartoId={editingReparto.id}
          choferes={choferes}
          camiones={camiones}
          initial={{
            nombre: editingReparto.nombre,
            descripcion: editingReparto.descripcion ?? "",
            choferId: editingReparto.chofer?.id ?? "",
            camionIds: editingReparto.camiones.map((c) => c.camion_id),
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
