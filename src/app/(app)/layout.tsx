import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

const NAV_LINKS = [
  { href: "/pedidos", label: "Notas de pedido" },
  { href: "/productos", label: "Productos" },
  { href: "/precios", label: "Precios" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name || user.email || "";
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between bg-btm-navy px-4 py-3 sm:px-6">
        <Link href="/pedidos" className="flex items-center">
          <Image
            src="/brand/btm-icon.png"
            alt="BTM"
            width={32}
            height={36}
            className="h-9 w-auto brightness-0 invert sm:hidden"
          />
          <Image
            src="/brand/btm-horizontal-tagline.png"
            alt="BTM Nutrición Animal"
            width={200}
            height={51}
            className="hidden h-auto w-[200px] brightness-0 invert sm:block"
          />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:text-btm-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 sm:inline">{fullName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-btm-navy"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <nav className="grid grid-cols-3 border-t border-black/10 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="py-3 text-center font-display text-xs font-bold uppercase tracking-wide text-btm-navy"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
