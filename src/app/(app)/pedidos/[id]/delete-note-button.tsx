"use client";

import { useState, useTransition } from "react";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function DeleteNoteButton({
  numero,
  deleteAction,
}: {
  numero: string;
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
          ¿Eliminar la nota <span className="font-semibold">{numero}</span>? Esta acción no se puede deshacer.
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
      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-btm-red/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red/10"
    >
      <TrashIcon /> Eliminar nota
    </button>
  );
}
