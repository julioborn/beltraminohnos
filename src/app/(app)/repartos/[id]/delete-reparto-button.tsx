"use client";

import { useState, useTransition } from "react";

export function DeleteRepartoButton({
  nombre,
  deleteAction,
}: {
  nombre: string;
  deleteAction: () => Promise<{ error?: string } | undefined>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAction();
      if (result?.error) setError(result.error);
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-btm-red/30 bg-btm-red/5 p-3">
        <p className="text-sm text-btm-black/80">
          ¿Eliminar el reparto <span className="font-semibold">{nombre}</span>? Esta acción no se puede deshacer.
        </p>
        {error && <p className="text-xs text-btm-red">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="cursor-pointer rounded-full bg-btm-red px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Eliminando..." : "Sí, eliminar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="cursor-pointer rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full cursor-pointer rounded-full border border-btm-red/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red/10"
    >
      Eliminar reparto
    </button>
  );
}
