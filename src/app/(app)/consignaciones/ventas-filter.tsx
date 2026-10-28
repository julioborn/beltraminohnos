"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function VentasFilter({
  sucursales,
  selectedSucursal,
  selectedMes,
}: {
  sucursales: { id: string; name: string }[];
  selectedSucursal: string;
  selectedMes: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/consignaciones/panel?${params.toString()}`);
    });
  }

  function clear() {
    const params = new URLSearchParams(searchParams);
    params.delete("ventasSucursal");
    params.delete("ventasMes");
    startTransition(() => {
      router.push(`/consignaciones/panel?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="ventasSucursal" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
          Sucursal
        </label>
        <select
          id="ventasSucursal"
          defaultValue={selectedSucursal}
          disabled={pending}
          onChange={(e) => update("ventasSucursal", e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-60"
        >
          <option value="">Todas</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="ventasMes" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
          Mes
        </label>
        <input
          id="ventasMes"
          type="month"
          defaultValue={selectedMes}
          disabled={pending}
          onChange={(e) => update("ventasMes", e.target.value)}
          className="rounded-md border border-black/15 px-3 py-2 text-sm disabled:opacity-60"
        />
      </div>
      {(selectedSucursal || selectedMes) && (
        <button
          type="button"
          disabled={pending}
          onClick={clear}
          className="rounded-md border border-black/15 px-4 py-2 text-xs font-semibold text-btm-black/70 hover:bg-black/5 disabled:opacity-60"
        >
          Limpiar
        </button>
      )}
      {pending && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-btm-navy/30 border-t-btm-navy"
          aria-hidden
        />
      )}
    </div>
  );
}
