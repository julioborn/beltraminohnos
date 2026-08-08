import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
        <Image
          src="/brand/btm-horizontal-tagline.png"
          alt="BTM Nutrición Animal"
          width={320}
          height={82}
          className="h-auto w-[320px]"
          priority
        />
        <LoginForm next={next ?? "/pedidos"} />
      </div>

      <div className="relative h-24 overflow-hidden sm:h-32">
        <div className="animate-truck-enter absolute bottom-0 right-4 w-56 sm:w-72">
          <Image
            src="/brand/truck-hero.png"
            alt="Camión BTM Nutrición Animal"
            width={1200}
            height={801}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
