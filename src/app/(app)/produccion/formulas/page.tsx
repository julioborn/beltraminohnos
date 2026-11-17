import Link from "next/link";
import { redirect } from "next/navigation";
import { canViewProduccion } from "@/lib/auth/role";
import { getFormulasAdmin, getFormulaIngredienteOptions } from "@/lib/data/produccion";
import { NuevaFormulaSection } from "./nueva-formula-section";
import { FormulasList } from "./formulas-list";

const PAGE_SIZE = 20;

export default async function FormulasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await canViewProduccion())) {
    redirect("/inicio");
  }

  const { page: pageParam } = await searchParams;
  const [allFormulas, { plataformas, productos }] = await Promise.all([getFormulasAdmin(), getFormulaIngredienteOptions()]);

  const totalPages = Math.max(1, Math.ceil(allFormulas.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const formulas = allFormulas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function pageHref(targetPage: number) {
    return `/produccion/formulas${targetPage > 1 ? `?page=${targetPage}` : ""}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          href="/produccion"
          className="mb-1 flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Producción
        </Link>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">Fórmulas</h1>
        <p className="text-sm text-btm-black/60">Recetas de producción: ingredientes y kg por set de cada fórmula.</p>
      </div>

      <NuevaFormulaSection plataformas={plataformas} productos={productos} />

      <FormulasList formulas={formulas} plataformas={plataformas} productos={productos} />

      {allFormulas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-btm-black/50">
            Página {page} de {totalPages} · {allFormulas.length} fórmula{allFormulas.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
              >
                Anterior
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                Anterior
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
              >
                Siguiente
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                Siguiente
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
