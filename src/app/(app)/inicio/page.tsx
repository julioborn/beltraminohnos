import Image from "next/image";
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
        <path d="M12 2v20" />
        <path d="M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

const SECONDARY_ITEMS = [
  {
    href: "/reportes",
    label: "Reportes",
    description: "Ventas por cliente, producto, vendedor y zona",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    href: "/estadisticas",
    label: "Estadísticas",
    description: "Facturación, tendencias y rankings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function InicioPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image
          src="/brand/btm-horizontal.png"
          alt="BTM"
          width={280}
          height={72}
          className="h-auto w-56 sm:w-64"
          priority
        />
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-btm-navy/60">
          Pedidos y Logística
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-10 text-center shadow-sm transition-colors hover:border-btm-navy"
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

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {SECONDARY_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-5 py-5 text-left shadow-sm transition-colors hover:border-btm-navy"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-btm-navy/10 text-btm-navy transition-colors group-hover:bg-btm-navy group-hover:text-white">
              {item.icon}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-sm font-extrabold uppercase tracking-wide text-btm-navy">
                {item.label}
              </span>
              <span className="text-xs text-btm-black/50">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
