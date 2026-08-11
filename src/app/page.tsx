import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/brand/pattern-tile.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "85px 85px",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-8 rounded-2xl bg-white p-8 shadow-[0_0_2px_rgba(0,0,0,0.06),0_0_40px_rgba(33,48,93,0.2)] sm:p-12">
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

        <LoginForm next={next ?? "/inicio"} />
      </div>
    </div>
  );
}
