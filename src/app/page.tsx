import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-white px-6 py-16">
      <Image
        src="/brand/btm-horizontal-tagline.png"
        alt="BTM Nutrición Animal"
        width={320}
        height={82}
        className="h-auto w-[320px]"
        priority
      />

      <LoginForm next={next ?? "/pedidos"} />

      <div className="w-full max-w-70 overflow-hidden sm:max-w-xs">
        <div className="animate-truck-enter">
          <Image
            src="/brand/truck-hero.png"
            alt="Camión BTM Nutrición Animal"
            width={1200}
            height={807}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
