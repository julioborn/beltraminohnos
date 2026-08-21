"use client";

import { useRef, useState } from "react";
import { PersonTable } from "./person-table";
import { CamionesTable } from "./camiones-table";
import {
  createVendedor,
  renameVendedor,
  setVendedorActive,
  deleteVendedor,
  createChofer,
  renameChofer,
  setChoferActive,
  deleteChofer,
} from "@/lib/actions/personal";

type Person = { id: string; name: string; active: boolean };
type Camion = {
  id: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  dominio: string;
  chofer_id: string | null;
  active: boolean;
};

type SectionKey = "vendedores" | "choferes" | "flota";

function VendedoresIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

function ChoferesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M4.5 16.5 9.8 13.4M19.5 16.5 14.2 13.4" />
    </svg>
  );
}

function FlotaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M3 17V7a1 1 0 0 1 1-1h9v11" />
      <path d="M13 10h4l3 3v4h-2" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </svg>
  );
}

const SECTIONS: { key: SectionKey; label: string; description: string; icon: React.ReactNode }[] = [
  { key: "vendedores", label: "Vendedores", description: "Alta, edición y estado", icon: <VendedoresIcon /> },
  { key: "choferes", label: "Choferes", description: "Alta, edición y estado", icon: <ChoferesIcon /> },
  { key: "flota", label: "Flota", description: "Camiones, acoplados y asignación", icon: <FlotaIcon /> },
];

export function PersonalSections({
  vendedores,
  choferes,
  camiones,
}: {
  vendedores: Person[];
  choferes: Person[];
  camiones: Camion[];
}) {
  const [open, setOpen] = useState<SectionKey | null>("vendedores");
  const resultsRef = useRef<HTMLDivElement>(null);

  function toggle(key: SectionKey) {
    setOpen((prev) => {
      const next = prev === key ? null : key;
      if (next) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="btm-card flex flex-col gap-6 p-5 sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Personal
          </h1>
          <p className="text-sm text-btm-black/60">
            Vendedores, choferes y flota disponibles para las notas de pedido. Tocá una tarjeta para ver y editar esa sección.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {SECTIONS.map((section) => {
            const isOpen = open === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => toggle(section.key)}
                className={`group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center shadow-sm transition-shadow hover:shadow-md sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-7 ${
                  isOpen ? "border-btm-navy bg-btm-navy/5" : "border-black/10 bg-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-14 sm:w-14 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-6 sm:[&_svg]:w-6 ${
                    isOpen ? "bg-btm-red text-white" : "bg-btm-red/10 text-btm-red group-hover:bg-btm-red group-hover:text-white"
                  }`}
                >
                  {section.icon}
                </span>
                <span className="font-display text-[11px] font-extrabold uppercase tracking-wide text-btm-navy sm:text-base">
                  {section.label}
                </span>
                <span className="hidden text-xs text-btm-black/50 sm:block">{section.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={resultsRef} className="scroll-mt-4" />

      {open === "vendedores" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-black">Vendedores</h2>
          <PersonTable
            people={vendedores}
            placeholder="Ej: JUAN PABLO"
            emptyLabel="No hay vendedores cargados."
            createAction={createVendedor}
            renameAction={renameVendedor}
            setActiveAction={setVendedorActive}
            deleteAction={deleteVendedor}
          />
        </section>
      )}

      {open === "choferes" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-black">Choferes</h2>
          <PersonTable
            people={choferes}
            placeholder="Ej: BRITEZ ANTONIO"
            emptyLabel="No hay choferes cargados."
            createAction={createChofer}
            renameAction={renameChofer}
            setActiveAction={setChoferActive}
            deleteAction={deleteChofer}
          />
        </section>
      )}

      {open === "flota" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-btm-black">Flota</h2>
          <CamionesTable camiones={camiones} choferes={choferes} />
        </section>
      )}
    </div>
  );
}
