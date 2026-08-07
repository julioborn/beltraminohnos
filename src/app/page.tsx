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
      <div className="relative h-80 shrink-0 overflow-hidden bg-btm-navy sm:h-96 md:h-auto md:flex-1">
        <Image
          src="/brand/login-banner.jpg"
          alt="BTM Nutrición Animal — flota y cartel publicitario"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-top"
        />
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
