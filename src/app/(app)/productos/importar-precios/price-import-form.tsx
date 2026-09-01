"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { previewPriceImport, applyPriceImport, type PriceImportState } from "@/lib/actions/price-import";
import { PACKAGING_LABELS } from "@/lib/packaging";

const initialState: PriceImportState = { status: "idle" };

function formatPrice(n: number | null) {
  if (n === null) return "—";
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PriceImportForm() {
  const [state, formAction, pending] = useActionState(previewPriceImport, initialState);
  const [applying, startApply] = useTransition();
  const [applyResult, setApplyResult] = useState<{ error?: string; updated?: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = state.status === "preview" ? state.preview : null;
  const changedRows = preview
    ? [...preview.changes]
        .filter((c) => c.changed)
        .sort((a, b) => a.productName.localeCompare(b.productName) || a.zoneName.localeCompare(b.zoneName))
    : [];
  const unchangedCount = preview ? preview.changes.length - changedRows.length : 0;

  function handleConfirm() {
    if (!preview) return;
    setApplyResult(null);
    startApply(async () => {
      const result = await applyPriceImport(preview.changes);
      setApplyResult(result);
    });
  }

  function assignFile(file: File | undefined) {
    if (!file || !fileInputRef.current) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInputRef.current.files = dataTransfer.files;
    setFileName(file.name);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    assignFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="btm-card flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Actualizar lista de precios
          </h1>
          <p className="text-sm text-btm-black/60">
            Subí el Excel de la lista vigente (mismo formato de siempre, con sus hojas por zona) y revisá los cambios
            antes de aplicarlos.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging ? "border-btm-navy bg-btm-navy/5" : "border-black/15 hover:border-btm-navy/40"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-btm-navy/60"
              aria-hidden
            >
              <path d="M7 18a4.5 4.5 0 0 1-.5-8.98A5.5 5.5 0 0 1 17.4 7.5 4 4 0 0 1 17 15.5" />
              <path d="M12 20v-8M9 15l3-3 3 3" />
            </svg>
            <p className="text-sm font-medium text-btm-navy">
              {fileName ?? "Arrastrá el Excel acá o hacé clic para elegirlo"}
            </p>
            <p className="text-xs text-btm-black/50">Archivo .xlsx</p>
            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              accept=".xlsx"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="hidden"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer self-end rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Analizando..." : "Analizar archivo"}
          </button>
        </form>

        {state.status === "error" && <p className="text-sm font-medium text-btm-red">{state.message}</p>}
      </div>

      {preview && (
        <div className="btm-card flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
                Vista previa de cambios
              </h2>
              <p className="text-sm text-btm-black/60">
                {changedRows.length} precio{changedRows.length === 1 ? "" : "s"} para actualizar
                {unchangedCount > 0 ? ` · ${unchangedCount} sin cambios (no se muestran)` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={applying || changedRows.length === 0}
              className="cursor-pointer rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying ? "Aplicando..." : "Confirmar actualización"}
            </button>
          </div>

          {applyResult && !applyResult.error && (
            <p className="rounded-md bg-btm-fabricado-bg px-3 py-2 text-sm font-medium text-green-900">
              Listo, se actualizaron {applyResult.updated} precios.
            </p>
          )}
          {applyResult?.error && (
            <p className="rounded-md bg-btm-red/10 px-3 py-2 text-sm font-medium text-btm-red">
              No se pudo aplicar: {applyResult.error}
            </p>
          )}

          {preview.unmatchedProducts.length > 0 && (
            <div className="rounded-md border border-btm-parcial/40 bg-btm-parcial-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
                Productos del Excel que no coinciden con ningún producto del sistema (no se actualizaron):
              </p>
              <p className="mt-1 text-sm text-orange-900">{preview.unmatchedProducts.join(", ")}</p>
            </div>
          )}

          {preview.unmatchedColumns.length > 0 && (
            <div className="rounded-md border border-btm-parcial/40 bg-btm-parcial-bg/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
                Columnas que no se pudieron reconocer (no se actualizaron):
              </p>
              <p className="mt-1 text-sm text-orange-900">
                {preview.unmatchedColumns.map((c) => `${c.header} (${c.sheet})`).join(", ")}
              </p>
            </div>
          )}

          {changedRows.length > 0 && (
            <div className="max-h-96 overflow-y-auto rounded-lg border border-black/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Envase</th>
                    <th className="px-3 py-2">Zona</th>
                    <th className="px-3 py-2 text-right">Antes</th>
                    <th className="px-3 py-2 text-right">Ahora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {changedRows.map((c) => (
                    <tr key={`${c.productId}_${c.packagingType}_${c.zoneId}`}>
                      <td className="px-3 py-1.5 font-medium">{c.productName}</td>
                      <td className="px-3 py-1.5 text-btm-black/70">{PACKAGING_LABELS[c.packagingType]}</td>
                      <td className="px-3 py-1.5 text-btm-black/70">{c.zoneName}</td>
                      <td className="btm-fig px-3 py-1.5 text-right text-btm-black/50">{formatPrice(c.oldPrice)}</td>
                      <td className="btm-fig px-3 py-1.5 text-right font-semibold text-btm-navy">
                        {formatPrice(c.newPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
