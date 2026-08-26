import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/mobile-menu";
import { DolarBadge } from "@/components/dolar-badge";

const NAV_LINKS = [
  { href: "/inicio", label: "Inicio" },
  { href: "/pedidos", label: "Notas de pedido" },
  { href: "/cercanos", label: "Pedidos cercanos" },
  { href: "/repartos", label: "Repartos" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/productos", label: "Productos y precios" },
  { href: "/personal", label: "Personal" },
  { href: "/reportes", label: "Reportes" },
  { href: "/estadisticas", label: "Estadísticas" },
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
    <div className="flex min-h-full flex-1 flex-col">
      <div className="bg-btm-navy" style={{ height: "env(safe-area-inset-top)" }} aria-hidden />
      <header className="relative flex items-center gap-2 border-b-[3px] border-btm-red bg-btm-navy px-4 py-3 shadow-[0_2px_12px_rgba(20,29,58,0.25)] sm:px-6">
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
        <DolarBadge />
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
