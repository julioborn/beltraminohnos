"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, renameProduct, setProductActive, deleteProduct } from "@/lib/actions/products";
import { updatePrice } from "@/lib/actions/prices";
import { PRICEABLE_PACKAGING_TYPES, PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";

type Product = { id: string; name: string; active: boolean };
type Zone = { id: string; code: string; name: string };
type PriceRow = { product_id: string; packaging_type: PackagingType; zone_id: string; price_usd: number | null };

function priceKey(productId: string, packagingType: PackagingType, zoneId: string) {
  return `${productId}_${packagingType}_${zoneId}`;
}

const TAB_LABELS: Partial<Record<PackagingType, string>> = {
  GRANEL: "Granel y Big Bag",
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

export function ProductsPricesTable({
  products,
  zones,
  prices,
}: {
  products: Product[];
  zones: Zone[];
  prices: PriceRow[];
}) {
  const [createState, createAction, createPending] = useActionState(createProduct, undefined);
  const [tab, setTab] = useState<PackagingType>("GRANEL");
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id ?? "");
  const selectedZone = zones.find((z) => z.id === zoneId) ?? zones[0];

  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.name])),
  );
  const [priceValues, setPriceValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of prices) {
      map[priceKey(p.product_id, p.packaging_type, p.zone_id)] = p.price_usd?.toString() ?? "";
    }
    return map;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);
  const [savingPriceKey, setSavingPriceKey] = useState<string | null>(null);
  const [errorPriceKey, setErrorPriceKey] = useState<string | null>(null);
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

  function handlePriceBlur(productId: string, zoneId: string, raw: string) {
    const k = priceKey(productId, tab, zoneId);
    const parsed = raw.trim() === "" ? null : Number(raw);
    if (parsed !== null && Number.isNaN(parsed)) return;

    setSavingPriceKey(k);
    setErrorPriceKey(null);
    startTransition(async () => {
      const result = await updatePrice(productId, tab, zoneId, parsed);
      setSavingPriceKey(null);
      if (result.error) setErrorPriceKey(k);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={createAction} className="flex items-end gap-3 rounded-lg border border-black/10 p-4">
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
          disabled={createPending}
          className="cursor-pointer rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red disabled:opacity-60"
        >
          {createPending ? "Agregando..." : "Agregar"}
        </button>
      </form>
      {createState?.error && <p className="text-sm font-medium text-btm-red">{createState.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {PRICEABLE_PACKAGING_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
                tab === t ? "bg-btm-navy text-white" : "border border-btm-navy text-btm-navy hover:bg-btm-navy/10"
              }`}
            >
              {TAB_LABELS[t] ?? PACKAGING_LABELS[t]}
            </button>
          ))}
        </div>
        <select
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="cursor-pointer rounded-full border border-btm-navy px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-btm-black/50">Precios en USD por tonelada para el envase y la zona seleccionados. Los cambios se guardan automáticamente.</p>

      {/* Mobile: one card per product, zone prices stacked inside */}
      <div className="flex flex-col gap-3 lg:hidden">
        {products.map((product) => {
          const isEditing = editingId === product.id;
          const isConfirmingDelete = confirmDeleteId === product.id;
          return (
            <div
              key={product.id}
              className={`flex flex-col gap-3 rounded-lg border border-black/10 p-3 ${product.active ? "" : "opacity-50"}`}
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
                      className="cursor-pointer rounded-full bg-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                    >
                      {savingId === product.id ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEdit(product)}
                      className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : isConfirmingDelete ? (
                <>
                  <p className="text-sm text-btm-black/70">¿Eliminar &ldquo;{product.name}&rdquo;?</p>
                  {deleteError?.id === product.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="cursor-pointer rounded-full bg-btm-red px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                    >
                      {deletingId === product.id ? "Eliminando..." : "Sí, eliminar"}
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{product.name}</p>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        title="Editar"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => askDelete(product.id)}
                        title="Eliminar"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-red hover:text-btm-red"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(product.id, !product.active)}
                    className={`self-start cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                      product.active
                        ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                        : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                    }`}
                  >
                    {product.active ? "Activo" : "Inactivo"}
                  </button>
                  {selectedZone && (
                    <div className="border-t border-black/10 pt-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-btm-black/50">Precio · {selectedZone.name}</span>
                        {(() => {
                          const k = priceKey(product.id, tab, selectedZone.id);
                          const value = priceValues[k] ?? "";
                          return (
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={value}
                              onChange={(e) => setPriceValues((prev) => ({ ...prev, [k]: e.target.value }))}
                              onBlur={(e) => handlePriceBlur(product.id, selectedZone.id, e.target.value)}
                              placeholder="—"
                              className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                                errorPriceKey === k
                                  ? "border-btm-red"
                                  : savingPriceKey === k
                                    ? "border-btm-navy"
                                    : "border-black/15"
                              }`}
                            />
                          );
                        })()}
                      </label>
                    </div>
                  )}
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

      {/* Desktop: single table with product management + price for the selected envase/zona */}
      <div className="hidden rounded-lg border border-black/10 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="w-28 px-3 py-3">Estado</th>
              <th className="w-40 px-3 py-3">Precio{selectedZone ? ` · ${selectedZone.name}` : ""}</th>
              <th className="w-24 px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((product) => {
              const isEditing = editingId === product.id;
              const isConfirmingDelete = confirmDeleteId === product.id;
              return (
                <tr key={product.id} className={product.active ? "" : "opacity-50"}>
                  <td className="px-4 py-2 font-medium">
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
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product.id, !product.active)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        product.active
                          ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                          : "bg-black/10 text-btm-black/60 hover:bg-black/15"
                      }`}
                    >
                      {product.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-2 py-1.5">
                    {selectedZone && (() => {
                      const k = priceKey(product.id, tab, selectedZone.id);
                      const value = priceValues[k] ?? "";
                      return (
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={value}
                          onChange={(e) => setPriceValues((prev) => ({ ...prev, [k]: e.target.value }))}
                          onBlur={(e) => handlePriceBlur(product.id, selectedZone.id, e.target.value)}
                          placeholder="—"
                          className={`w-32 rounded-md border px-2 py-1.5 text-sm ${
                            errorPriceKey === k
                              ? "border-btm-red"
                              : savingPriceKey === k
                                ? "border-btm-navy"
                                : "border-black/15"
                          }`}
                        />
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => saveEdit(product)}
                          disabled={savingId === product.id}
                          className="cursor-pointer rounded-full bg-btm-navy px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red disabled:opacity-60"
                        >
                          {savingId === product.id ? "..." : "OK"}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(product)}
                          className="cursor-pointer rounded-full border border-black/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                        >
                          X
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="cursor-pointer rounded-full bg-btm-red px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:opacity-60"
                          >
                            {deletingId === product.id ? "..." : "Sí"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-full border border-black/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                          >
                            No
                          </button>
                        </div>
                        {deleteError?.id === product.id && <p className="text-xs text-btm-red">{deleteError.message}</p>}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          title="Editar"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-black/15 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(product.id)}
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
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-btm-black/50">
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
