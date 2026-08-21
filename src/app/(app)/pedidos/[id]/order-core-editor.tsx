"use client";

import { useState } from "react";
import type { UpdateOrderState } from "@/lib/actions/order-notes";
import { OrderCoreForm, type OrderCoreInitial } from "./order-core-form";

type Option = { id: string; name: string };
type Zone = { id: string; code: string; name: string };
type Cliente = { id: string; name: string };

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function OrderCoreEditor({
  action,
  products,
  zones,
  vendedores,
  priceMap,
  clientes,
  initial,
  children,
}: {
  action: (prevState: UpdateOrderState, formData: FormData) => Promise<UpdateOrderState>;
  products: Option[];
  zones: Zone[];
  vendedores: Option[];
  priceMap: Record<string, number | null>;
  clientes: Cliente[];
  initial: OrderCoreInitial;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="btm-card flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Editar nota</h2>
        <OrderCoreForm
          action={action}
          products={products}
          zones={zones}
          vendedores={vendedores}
          priceMap={priceMap}
          clientes={clientes}
          initial={initial}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-fit cursor-pointer items-center gap-1.5 self-end rounded-full border border-btm-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
      >
        <PencilIcon /> Editar nota
      </button>
      {children}
    </div>
  );
}
