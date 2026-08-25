"use client";

import { useState } from "react";
import type { UpdateRepartoState } from "@/lib/actions/repartos";
import { RepartoEditForm, type RepartoInitial } from "./reparto-edit-form";

type Chofer = { id: string; name: string };
type Camion = {
  id: string;
  dominio: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  chofer_id: string | null;
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function RepartoEditor({
  action,
  choferes,
  camiones,
  initial,
  children,
}: {
  action: (prevState: UpdateRepartoState, formData: FormData) => Promise<UpdateRepartoState>;
  choferes: Chofer[];
  camiones: Camion[];
  initial: RepartoInitial;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Editar reparto</h2>
        <RepartoEditForm
          action={action}
          choferes={choferes}
          camiones={camiones}
          initial={initial}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-fit cursor-pointer items-center gap-1.5 self-end rounded-full border border-btm-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
      >
        <PencilIcon /> Editar reparto
      </button>
      {children}
    </div>
  );
}
