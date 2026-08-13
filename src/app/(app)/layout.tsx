import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/mobile-menu";
import { BrandTexture } from "@/components/brand-texture";

const NAV_LINKS = [
  { href: "/inicio", label: "Inicio" },
  { href: "/pedidos", label: "Notas de pedido" },
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
      <header className="relative overflow-hidden bg-gradient-to-r from-btm-navy to-btm-navy-deep px-4 py-3 shadow-[0_2px_12px_rgba(20,29,58,0.25)] sm:px-6">
        <BrandTexture opacity={0.05} invert />
        <div className="relative flex items-center gap-2">
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
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-btm-red via-btm-red/70 to-transparent" />
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
