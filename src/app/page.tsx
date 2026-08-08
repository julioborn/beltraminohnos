import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-btm-navy">
      {/* Mobile: simpler stacked layout, the trailer card is too small to be usable at this width */}
      <div className="flex flex-1 flex-col md:hidden">
        <div className="relative h-52 shrink-0 overflow-hidden sm:h-60">
          <Image
            src="/brand/truck-hero.png"
            alt="Camión BTM Nutrición Animal"
            fill
            priority
            sizes="100vw"
            className="animate-truck-enter object-contain object-center"
          />
        </div>
        <div className="flex flex-1 items-center justify-center bg-[#F6F5F3] px-6 py-10">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(33,48,93,0.35)]">
            <Image
              src="/brand/btm-horizontal-tagline.png"
              alt="BTM Nutrición Animal"
              width={168}
              height={43}
              className="h-auto w-[168px]"
            />
            <h1 className="mt-8 font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
              Ingresar
            </h1>
            <p className="mb-6 mt-1 text-sm text-btm-black/60">
              Accedé al sistema de notas de pedido.
            </p>
            <LoginForm next={next ?? "/pedidos"} />
          </div>
        </div>
      </div>

      {/* Desktop: truck drives in, login card rides on the trailer */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden px-4 py-10 md:flex">
        <div
          className="animate-truck-enter relative w-full max-w-[1100px]"
          style={{ aspectRatio: "1200 / 801" }}
        >
          <Image
            src="/brand/truck-hero.png"
            alt="Camión BTM Nutrición Animal"
            fill
            priority
            sizes="1100px"
            className="object-contain"
          />

          <div
            className="absolute flex flex-col justify-center rounded-lg bg-white/95 p-3 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.55)] sm:p-5"
            style={{ left: "68.5%", top: "15%", width: "28.5%", height: "56%" }}
          >
            <h1 className="font-display text-[clamp(0.7rem,1.6vw,1.05rem)] font-extrabold uppercase leading-tight tracking-tight text-btm-navy">
              Ingresar
            </h1>
            <p className="mb-2 text-[clamp(0.5rem,0.9vw,0.75rem)] leading-snug text-btm-black/60 sm:mb-3">
              Notas de pedido
            </p>
            <LoginForm next={next ?? "/pedidos"} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
