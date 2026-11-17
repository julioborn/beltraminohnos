"use client";

import { useState } from "react";
import { FormulaForm } from "./formula-form";

export function NuevaFormulaSection({ plataformas, productos }: { plataformas: string[]; productos: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center justify-between gap-2 text-left">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">Nueva fórmula</h2>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-btm-navy">{open ? "Cerrar" : "Abrir"}</span>
      </button>
      {open && <FormulaForm plataformas={plataformas} productos={productos} />}
    </section>
  );
}
