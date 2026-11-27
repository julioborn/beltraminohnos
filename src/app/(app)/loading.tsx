// Sin esto, Next.js se queda clavado en la página vieja hasta que termina
// de cargar todos los datos de la nueva (nada de "ir al lugar al instante")
// — un loading.tsx envuelve la página en un <Suspense> y hace que la
// navegación sea inmediata: el layout (header) sigue interactivo y esto se
// muestra en el lugar del contenido mientras tanto. Uno solo acá en vez de
// uno por página porque casi todas comparten el mismo contenedor
// "mx-auto max-w-6xl px-4 py-6", así que no hay salto de layout al
// reemplazarse por el contenido real.
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Cargando">
      <div className="flex items-center gap-3">
        <span
          className="h-7 w-7 shrink-0 animate-spin rounded-full border-[3px] border-btm-navy/20 border-t-btm-navy"
          aria-hidden
        />
        <div className="h-6 w-48 animate-pulse rounded bg-black/5" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-20 animate-pulse rounded-lg bg-black/5" />
        <div className="h-20 animate-pulse rounded-lg bg-black/5" />
        <div className="h-20 animate-pulse rounded-lg bg-black/5" />
      </div>
    </div>
  );
}
