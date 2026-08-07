import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Visual panel */}
      <div className="relative flex h-auto shrink-0 flex-col bg-btm-navy md:flex-1">
        <div className="px-6 pt-6 sm:px-10 sm:pt-10">
          <Image
            src="/brand/btm-icon.png"
            alt="BTM"
            width={30}
            height={34}
            className="h-8 w-auto brightness-0 invert"
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 sm:gap-5 sm:px-10">
          <div className="w-full max-w-[300px] overflow-hidden rounded-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] sm:max-w-sm">
            <Image
              src="/brand/login-billboard.jpg"
              alt="Cartel publicitario de BTM Nutrición Animal"
              width={1100}
              height={667}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="w-full max-w-[300px] overflow-hidden rounded-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] sm:max-w-sm">
            <Image
              src="/brand/login-trucks.jpg"
              alt="Flota de camiones BTM"
              width={1100}
              height={440}
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-10 sm:pb-10">
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white/70">
            Pedidos y Logística
          </p>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex flex-1 items-center justify-center bg-[#F6F5F3] px-6 py-10 sm:py-14">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(33,48,93,0.35)] sm:p-10">
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
  );
}
