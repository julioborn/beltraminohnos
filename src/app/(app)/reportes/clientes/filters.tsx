"use client";

// Filtros del informe por cliente: selector de cliente, pestañas de año y
// multi-selección de productos (con buscador) — fiel a la captura de
// PowerBI que mandó el dueño de referencia. Empuja a la URL igual que
// VentasFilter/PanelSucursalSelect en Consignaciones.

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

export function ClienteReportFilters({
  clientes,
  years,
  products,
  selectedCliente,
  selectedAnio,
  selectedProductos,
}: {
  clientes: string[];
  years: number[];
  products: Option[];
  selectedCliente?: string;
  selectedAnio: number;
  selectedProductos: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [productOpen, setProductOpen] = useState(false);
  const [search, setSearch] = useState("");

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    startTransition(() => {
      router.push(`/reportes/clientes?${params.toString()}`);
    });
  }

  function toggleProducto(id: string) {
    pushParams((params) => {
      const next = new Set(selectedProductos);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size > 0) params.set("productos", Array.from(next).join(","));
      else params.delete("productos");
    });
  }

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="cliente" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
            Cliente
          </label>
          <select
            id="cliente"
            defaultValue={selectedCliente ?? ""}
            disabled={pending}
            onChange={(e) => pushParams((params) => (e.target.value ? params.set("cliente", e.target.value) : params.delete("cliente")))}
            className="min-w-[220px] rounded-md border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">Año</span>
          <div className="flex flex-wrap gap-1.5">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                disabled={pending}
                onClick={() => pushParams((params) => params.set("anio", String(y)))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  y === selectedAnio
                    ? "border-btm-navy bg-btm-navy text-white"
                    : "border-black/15 text-btm-black/70 hover:border-btm-navy"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {pending && (
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-btm-navy/30 border-t-btm-navy"
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setProductOpen((v) => !v)}
          className="flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-wide text-btm-navy"
        >
          Artículo {selectedProductos.length > 0 ? `(${selectedProductos.length} seleccionados)` : "(todos)"}
          <svg
            className={`h-3.5 w-3.5 transition-transform ${productOpen ? "rotate-90" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 4l6 6-6 6V4z" />
          </svg>
        </button>

        {productOpen && (
          <div className="flex max-w-sm flex-col gap-2 rounded-md border border-black/10 p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="rounded-md border border-black/15 px-2 py-1.5 text-sm"
            />
            <div className="flex items-center justify-between border-b border-black/5 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">
                Todos los productos
              </span>
              {selectedProductos.length > 0 && (
                <button
                  type="button"
                  onClick={() => pushParams((params) => params.delete("productos"))}
                  className="text-[11px] font-semibold text-btm-navy hover:text-btm-red"
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {filteredProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-0.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProductos.includes(p.id)}
                    onChange={() => toggleProducto(p.id)}
                    className="h-4 w-4 accent-btm-navy"
                  />
                  {p.name}
                </label>
              ))}
              {filteredProducts.length === 0 && <p className="text-sm text-btm-black/50">Sin resultados.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
