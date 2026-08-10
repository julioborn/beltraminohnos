import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-white px-6 py-16">
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/brand/btm-horizontal-tagline.png"
          alt="BTM Nutrición Animal"
          width={400}
          height={102}
          className="h-auto w-70 sm:w-100"
          priority
        />
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-btm-navy/60">
          Pedidos y Logística
        </p>
      </div>

      <LoginForm next={next ?? "/pedidos"} />
    </div>
  );
}
