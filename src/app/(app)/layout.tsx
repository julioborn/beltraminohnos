import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasFullAccess, type ProfileRole } from "@/lib/auth/role";
import { MobileMenu } from "@/components/mobile-menu";
import { DolarBadge } from "@/components/dolar-badge";

// Mismos 9 destinos y mismo orden que las cards de Inicio, para que el menú
// lateral y la pantalla de inicio coincidan exactamente.
const NAV_LINKS = [
  { href: "/inicio", label: "Inicio" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/cercanos", label: "Pedidos cercanos" },
  { href: "/repartos", label: "Repartos" },
  { href: "/productos", label: "Productos" },
  { href: "/productos/pendientes", label: "Pendientes por producto" },
  { href: "/personal", label: "Personal" },
  { href: "/reportes", label: "Reportes", fullAccessOnly: true },
  { href: "/estadisticas", label: "Estadísticas", fullAccessOnly: true },
  { href: "/cotizaciones", label: "Cotizaciones" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = user?.email ?? "";
  let role: ProfileRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name || user.email || "";
    role = (profile?.role as ProfileRole | undefined) ?? null;
  }

  const fullAccess = hasFullAccess(role);
  const navLinks = NAV_LINKS.filter((link) => fullAccess || !link.fullAccessOnly);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-btm-navy" style={{ height: "env(safe-area-inset-top)" }} aria-hidden />
      <header className="relative flex items-center gap-2 border-b-[3px] border-btm-red bg-btm-navy px-4 py-3 shadow-[0_2px_12px_rgba(20,29,58,0.25)] sm:px-6">
        <MobileMenu navLinks={navLinks} fullName={fullName} />
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
        <DolarBadge />
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
