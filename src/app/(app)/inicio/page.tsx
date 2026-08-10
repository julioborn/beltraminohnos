import Link from "next/link";

const ITEMS = [
  { href: "/pedidos", label: "Pedidos" },
  { href: "/productos", label: "Productos" },
  { href: "/precios", label: "Precios" },
];

export default function InicioPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy sm:text-3xl">
        ¿Qué querés hacer?
      </h1>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex h-32 items-center justify-center rounded-xl bg-btm-navy px-6 text-center font-display text-xl font-extrabold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-btm-red sm:h-40 sm:text-2xl"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
