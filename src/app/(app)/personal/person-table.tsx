"use client";

import { useActionState, useState, useTransition } from "react";
import type { CreatePersonState } from "@/lib/actions/personal";

type Person = { id: string; name: string; active: boolean };

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

export function PersonTable({
  people,
  placeholder,
  emptyLabel,
  createAction,
  renameAction,
  setActiveAction,
  deleteAction,
}: {
  people: Person[];
  placeholder: string;
  emptyLabel: string;
  createAction: (prevState: CreatePersonState, formData: FormData) => Promise<CreatePersonState>;
  renameAction: (id: string, name: string) => Promise<{ error?: string }>;
  setActiveAction: (id: string, active: boolean) => Promise<void>;
  deleteAction: (id: string) => Promise<{ error?: string } | undefined>;
}) {
  const [state, action, pending] = useActionState(createAction, undefined);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(people.map((p) => [p.id, p.name])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  function startEdit(person: Person) {
    setNames((prev) => ({ ...prev, [person.id]: person.name }));
    setEditingId(person.id);
    setConfirmDeleteId(null);
  }

  function cancelEdit(person: Person) {
    setNames((prev) => ({ ...prev, [person.id]: person.name }));
    setEditingId(null);
  }

  function saveEdit(person: Person) {
    const value = (names[person.id] ?? "").trim();
    if (!value || value === person.name) {
      setEditingId(null);
      return;
    }
    setSavingId(person.id);
    startTransition(async () => {
      await renameAction(person.id, value);
      setSavingId(null);
      setEditingId(null);
    });
  }

  function handleToggleActive(personId: string, active: boolean) {
    startTransition(() => {
      setActiveAction(personId, active);
    });
  }

  function askDelete(personId: string) {
    setConfirmDeleteId(personId);
    setEditingId(null);
    setDeleteError(null);
  }

  function handleDelete(person: Person) {
    setDeletingId(person.id);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteAction(person.id);
      setDeletingId(null);
      if (result?.error) {
        setDeleteError({ id: person.id, message: result.error });
      } else {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex items-end gap-3 rounded-lg border border-black/10 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={`name-${placeholder}`} className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Agregar
          </label>
          <input
            id={`name-${placeholder}`}
            name="name"
            required
            placeholder={placeholder}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red disabled:opacity-60"
        >
          {pending ? "Agregando..." : "Agregar"}
        </button>
      </form>
      {state?.error && <p className="text-sm font-medium text-btm-red">{state.error}</p>}

      {/* Mobile: cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {people.map((person) => {
          const isEditing = editingId === person.id;
          const isConfirmingDelete = confirmDeleteId === person.id;
          return (
            <div
              key={person.id}
              className={`flex flex-col gap-2 rounded-lg border border-black/10 p-3 ${person.active ? "" : "opacity-50"}`}
            >
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={names[person.id] ?? ""}
                    onChange={(e) => setNames((prev) => ({ ...prev, [person.id]: e.target.value }))}
                    className="w-full rounded-md border border-btm-navy px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(person)}
                      disabled={savingId === person.id}
                      className="cursor-pointer rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                    >
                      {savingId === person.id ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEdit(person)}
                      className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : isConfirmingDelete ? (
                <>
                  <p className="text-sm text-btm-black/70">¿Eliminar &ldquo;{person.name}&rdquo;?</p>
                  {deleteError?.id === person.id && (
                    <p className="text-xs text-btm-red">{deleteError.message}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(person)}
                      disabled={deletingId === person.id}
                      className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                    >
                      {deletingId === person.id ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">{person.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(person.id, !person.active)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        person.active
                          ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                          : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                      }`}
                    >
                      {person.active ? "Activo" : "Inactivo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(person)}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:border-btm-navy hover:text-btm-navy"
                    >
                      <PencilIcon /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => askDelete(person.id)}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-btm-red/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red/10"
                    >
                      <TrashIcon /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {people.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">{emptyLabel}</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="w-32 px-4 py-3">Estado</th>
              <th className="w-44 px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {people.map((person) => {
              const isEditing = editingId === person.id;
              const isConfirmingDelete = confirmDeleteId === person.id;
              return (
                <tr key={person.id} className={person.active ? "" : "opacity-50"}>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={names[person.id] ?? ""}
                        onChange={(e) => setNames((prev) => ({ ...prev, [person.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(person);
                          if (e.key === "Escape") cancelEdit(person);
                        }}
                        className="w-full rounded-md border border-btm-navy px-2 py-1.5 text-sm"
                      />
                    ) : (
                      <span className="block px-2 py-1.5">{person.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(person.id, !person.active)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        person.active
                          ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                          : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                      }`}
                    >
                      {person.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(person)}
                          disabled={savingId === person.id}
                          className="cursor-pointer rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                        >
                          {savingId === person.id ? "..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(person)}
                          className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(person)}
                            disabled={deletingId === person.id}
                            className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                          >
                            {deletingId === person.id ? "..." : "Sí"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                          >
                            No
                          </button>
                        </div>
                        {deleteError?.id === person.id && (
                          <p className="text-xs text-btm-red">{deleteError.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(person)}
                          title="Editar"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(person.id)}
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
            {people.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-btm-black/50">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
