"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, renameProduct, setProductActive, deleteProduct } from "@/lib/actions/products";

type Product = { id: string; name: string; active: boolean };

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

export function ProductsTable({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.name])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  function startEdit(product: Product) {
    setNames((prev) => ({ ...prev, [product.id]: product.name }));
    setEditingId(product.id);
    setConfirmDeleteId(null);
  }

  function cancelEdit(product: Product) {
    setNames((prev) => ({ ...prev, [product.id]: product.name }));
    setEditingId(null);
  }

  function saveEdit(product: Product) {
    const value = (names[product.id] ?? "").trim();
    if (!value || value === product.name) {
      setEditingId(null);
      return;
    }
    setSavingId(product.id);
    startTransition(async () => {
      await renameProduct(product.id, value);
      setSavingId(null);
      setEditingId(null);
    });
  }

  function handleToggleActive(productId: string, active: boolean) {
    startTransition(() => {
      setProductActive(productId, active);
    });
  }

  function askDelete(productId: string) {
    setConfirmDeleteId(productId);
    setEditingId(null);
    setDeleteError(null);
  }

  function handleDelete(product: Product) {
    setDeletingId(product.id);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      setDeletingId(null);
      if (result?.error) {
        setDeleteError({ id: product.id, message: result.error });
      } else {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex items-end gap-3 rounded-lg border border-black/10 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Nuevo producto
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ej: TERNERO 16%"
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red disabled:opacity-60"
        >
          {pending ? "Agregando..." : "Agregar"}
        </button>
      </form>
      {state?.error && <p className="text-sm font-medium text-btm-red">{state.error}</p>}

      {/* Mobile: cards, so long product names don't clip inside a narrow input */}
      <div className="flex flex-col gap-2 md:hidden">
        {products.map((product) => {
          const isEditing = editingId === product.id;
          const isConfirmingDelete = confirmDeleteId === product.id;
          return (
            <div
              key={product.id}
              className={`flex flex-col gap-2 rounded-lg border border-black/10 p-3 ${product.active ? "" : "opacity-50"}`}
            >
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={names[product.id] ?? ""}
                    onChange={(e) => setNames((prev) => ({ ...prev, [product.id]: e.target.value }))}
                    className="w-full rounded-md border border-btm-navy px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(product)}
                      disabled={savingId === product.id}
                      className="rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                    >
                      {savingId === product.id ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEdit(product)}
                      className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : isConfirmingDelete ? (
                <>
                  <p className="text-sm text-btm-black/70">¿Eliminar &ldquo;{product.name}&rdquo;?</p>
                  {deleteError?.id === product.id && (
                    <p className="text-xs text-btm-red">{deleteError.message}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                    >
                      {deletingId === product.id ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">{product.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id, !product.active)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        product.active
                          ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                          : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="flex items-center gap-1 rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:border-btm-navy hover:text-btm-navy"
                    >
                      <PencilIcon /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => askDelete(product.id)}
                      className="flex items-center gap-1 rounded-full border border-btm-red/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red/10"
                    >
                      <TrashIcon /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            No hay productos cargados.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="w-32 px-4 py-3">Estado</th>
              <th className="w-44 px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((product) => {
              const isEditing = editingId === product.id;
              const isConfirmingDelete = confirmDeleteId === product.id;
              return (
                <tr key={product.id} className={product.active ? "" : "opacity-50"}>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={names[product.id] ?? ""}
                        onChange={(e) => setNames((prev) => ({ ...prev, [product.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(product);
                          if (e.key === "Escape") cancelEdit(product);
                        }}
                        className="w-full rounded-md border border-btm-navy px-2 py-1.5 text-sm"
                      />
                    ) : (
                      <span className="block px-2 py-1.5">{product.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id, !product.active)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        product.active
                          ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                          : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(product)}
                          disabled={savingId === product.id}
                          className="rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                        >
                          {savingId === product.id ? "..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(product)}
                          className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                          >
                            {deletingId === product.id ? "..." : "Sí"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                          >
                            No
                          </button>
                        </div>
                        {deleteError?.id === product.id && (
                          <p className="text-xs text-btm-red">{deleteError.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          title="Editar"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(product.id)}
                          title="Eliminar"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-red hover:text-btm-red"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-btm-black/50">
                  No hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
