"use client";

import { useEffect } from "react";
import { updateReparto } from "@/lib/actions/repartos";
import { RepartoEditForm, type RepartoInitial } from "./[id]/reparto-edit-form";

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

export function EditRepartoModal({
  repartoId,
  choferes,
  camiones,
  initial,
  onClose,
}: {
  repartoId: string;
  choferes: Chofer[];
  camiones: Camion[];
  initial: RepartoInitial;
  onClose: () => void;
}) {
  const action = updateReparto.bind(null, repartoId);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="btm-card flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-navy">Editar reparto</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-black/60 hover:bg-black/5"
          >
            Cerrar
          </button>
        </div>
        <RepartoEditForm
          action={action}
          choferes={choferes}
          camiones={camiones}
          initial={initial}
          onCancel={onClose}
          onSaved={onClose}
        />
      </div>
    </div>
  );
}
