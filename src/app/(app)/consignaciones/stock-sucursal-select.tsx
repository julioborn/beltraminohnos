"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function StockSucursalSelect({
  sucursales,
  selected,
}: {
  sucursales: { id: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={selected}
        disabled={pending}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          params.set("stockChartSucursal", e.target.value);
          startTransition(() => {
            router.push(`/consignaciones/panel?${params.toString()}`);
          });
        }}
        className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm disabled:opacity-60"
      >
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {pending && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-btm-navy/30 border-t-btm-navy"
          aria-hidden
        />
      )}
    </div>
  );
}
