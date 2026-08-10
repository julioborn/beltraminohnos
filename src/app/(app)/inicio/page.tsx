import Link from "next/link";

const ITEMS = [
  {
    href: "/pedidos",
    label: "Pedidos",
    description: "Notas de pedido y seguimiento",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Productos",
    description: "Catálogo y estado de productos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    href: "/precios",
    label: "Precios",
    description: "Lista de precios por zona",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
        <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
        <path d="M7 7.01 7.01 7" />
      </svg>
    ),
  },
];

export default function InicioPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy sm:text-3xl">
          ¿Qué querés hacer?
        </h1>
        <p className="text-sm text-btm-black/50">Elegí una sección para empezar</p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-10 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-btm-navy hover:shadow-lg"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-btm-navy/10 text-btm-navy transition-colors group-hover:bg-btm-navy group-hover:text-white">
              {item.icon}
            </span>
            <span className="font-display text-lg font-extrabold uppercase tracking-wide text-btm-navy">
              {item.label}
            </span>
            <span className="text-xs text-btm-black/50">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
