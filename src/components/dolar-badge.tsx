"use client";

import { useEffect, useState } from "react";

export function DolarBadge() {
  const [venta, setVenta] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dolar/oficial")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.venta === "number") setVenta(data.venta);
      })
      .catch(() => {});
  }, []);

  if (venta === null) return null;

  return (
    <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-btm-fabricado/40 bg-btm-fabricado/10 px-2.5 py-1.5 text-xs font-bold text-btm-fabricado sm:gap-1.5 sm:px-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 8.5a2 2 0 0 1 2-1.5h1.5a1.75 1.75 0 0 1 0 3.5H11.5a1.75 1.75 0 0 0 0 3.5H13a2 2 0 0 0 2-1.5" />
        <path d="M12 6v1.2M12 16.8V18" />
      </svg>
      <span className="btm-fig whitespace-nowrap">
        ${venta.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </span>
  );
}
