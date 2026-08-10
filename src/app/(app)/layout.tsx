import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { MobileMenu } from "@/components/mobile-menu";

const NAV_LINKS = [
  { href: "/inicio", label: "Inicio" },
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
        <div className="flex items-center gap-2">
          <MobileMenu navLinks={NAV_LINKS} fullName={fullName} />
          <Link href="/inicio" className="flex items-center">
            <Image
              src="/brand/btm-horizontal-tagline.png"
              alt="BTM Nutrición Animal"
              width={200}
              height={51}
              className="h-auto w-32 brightness-0 invert sm:w-[200px]"
              priority
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.filter((link) => link.href !== "/inicio").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:text-btm-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-sm text-white/80">{fullName}</span>
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
    </div>
  );
}
