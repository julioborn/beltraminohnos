// Difumina el borde derecho de un contenedor con scroll horizontal, para
// avisar visualmente que hay más columnas/contenido fuera de vista — sin
// esto, una tabla angosta en mobile se corta en seco contra el borde sin
// ninguna pista de que se puede deslizar.
export function ScrollFade({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l from-white to-transparent"
        aria-hidden
      />
    </div>
  );
}
