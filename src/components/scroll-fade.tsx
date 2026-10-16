// Difumina el borde derecho de un contenedor con scroll horizontal, para
// avisar visualmente que hay más columnas/contenido fuera de vista — sin
// esto, una tabla angosta en mobile se corta en seco contra el borde sin
// ninguna pista de que se puede deslizar. El degradé tiene que arrancar del
// mismo color que el fondo real detrás de la tabla — por default el fondo
// de la página, pero pasá fadeFrom="from-white" cuando el contenedor está
// dentro de una .btm-card (blanca), si no el borde queda como una mancha.
export function ScrollFade({
  children,
  fadeFrom = "from-[var(--background)]",
}: {
  children: React.ReactNode;
  fadeFrom?: string;
}) {
  return (
    <div className="relative">
      {children}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l ${fadeFrom} to-transparent`}
        aria-hidden
      />
    </div>
  );
}
