"use client";

import { useActionState, useState, useTransition } from "react";
import { createProduct, renameProduct, setProductActive } from "@/lib/actions/products";

type Product = { id: string; name: string; active: boolean };

export function ProductsTable({ products }: { products: Product[] }) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((p) => [p.id, p.name])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRename(productId: string, value: string) {
    setSavingId(productId);
    startTransition(async () => {
      await renameProduct(productId, value);
      setSavingId(null);
    });
  }

  function handleToggleActive(productId: string, active: boolean) {
    startTransition(() => {
      setProductActive(productId, active);
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
        {products.map((product) => (
          <div
            key={product.id}
            className={`flex flex-col gap-2 rounded-lg border border-black/10 p-3 ${product.active ? "" : "opacity-50"}`}
          >
            <input
              value={names[product.id] ?? ""}
              onChange={(e) => setNames((prev) => ({ ...prev, [product.id]: e.target.value }))}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== product.name) {
                  handleRename(product.id, e.target.value);
                }
              }}
              className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                savingId === product.id ? "border-btm-navy" : "border-black/10"
              }`}
            />
            <button
              type="button"
              onClick={() => handleToggleActive(product.id, !product.active)}
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                product.active
                  ? "bg-btm-fabricado-bg text-green-900 hover:bg-green-200"
                  : "bg-black/10 text-btm-black/60 hover:bg-black/15"
              }`}
            >
              {product.active ? "Activo" : "Inactivo"}
            </button>
          </div>
        ))}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((product) => (
              <tr key={product.id} className={product.active ? "" : "opacity-50"}>
                <td className="px-4 py-2">
                  <input
                    value={names[product.id] ?? ""}
                    onChange={(e) => setNames((prev) => ({ ...prev, [product.id]: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value.trim() !== product.name) {
                        handleRename(product.id, e.target.value);
                      }
                    }}
                    className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                      savingId === product.id ? "border-btm-navy" : "border-transparent hover:border-black/15"
                    }`}
                  />
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
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-btm-black/50">
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
