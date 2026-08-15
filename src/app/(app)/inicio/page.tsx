import Image from "next/image";
import Link from "next/link";
import { BrandTexture } from "@/components/brand-texture";

const ITEMS = [
  {
    href: "/pedidos",
    label: "Pedidos",
    description: "Notas de pedido y seguimiento",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Productos",
    description: "Catálogo, estado y lista de precios por zona",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M9 7c0-2.5 1.3-4 3-4s3 1.5 3 4" />
        <path d="M7 7h10l1.2 12.6a2 2 0 0 1-2 2.4H7.8a2 2 0 0 1-2-2.4L7 7Z" />
        <path d="M9.5 11h5M9.3 15h5.4" />
      </svg>
    ),
  },
  {
    href: "/personal",
    label: "Personal",
    description: "Vendedores, choferes y flota",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="9" cy="8" r="3.25" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17.5" cy="8.5" r="2.5" />
        <path d="M16 13.2a5.5 5.5 0 0 1 5.5 6.3" />
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
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    description: "Armar y descargar una cotización en PDF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12.586 2.586a2 2 0 0 0-1.414-.586H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l9 9a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-9-9Z" />
        <circle cx="7.5" cy="7.5" r="1.25" />
      </svg>
    ),
  },
];

export default function InicioPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-10 overflow-hidden px-6 pt-8 pb-16 sm:pt-12">
      <BrandTexture opacity={0.05} />
      <div className="relative flex flex-col items-center gap-2 text-center">
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

      <div className="relative grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="btm-card btm-card-hover group flex flex-col items-center gap-3 px-5 py-8 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-btm-red/10 text-btm-red shadow-[0_4px_14px_-4px_rgba(223,9,20,0.35)] transition-colors group-hover:bg-btm-red group-hover:text-white">
              {item.icon}
            </span>
            <span className="font-display text-base font-extrabold uppercase tracking-wide text-btm-navy">
              {item.label}
            </span>
            <span className="text-xs text-btm-black/50">{item.description}</span>
          </Link>
        ))}
      </div>

      <div className="relative grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {SECONDARY_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="btm-card btm-card-hover group flex items-center gap-4 px-5 py-5 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-btm-red/10 text-btm-red shadow-[0_4px_14px_-4px_rgba(223,9,20,0.35)] transition-colors group-hover:bg-btm-red group-hover:text-white">
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
