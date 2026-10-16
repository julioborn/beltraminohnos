"use client";

import { useRouter } from "next/navigation";

export function EmpresaSelect({
  sucursales,
  selected,
}: {
  sucursales: { id: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="sucursal" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
        Empresa
      </label>
      <select
        id="sucursal"
        defaultValue={selected}
        onChange={(e) => router.push(`/consignaciones?sucursal=${e.target.value}`)}
        className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
      >
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
