import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-white px-6 py-24 text-center">
      <Image
        src="/brand/btm-horizontal-tagline.png"
        alt="BTM Nutrición Animal"
        width={420}
        height={107}
        className="h-auto w-[420px]"
        priority
      />
      <h1 className="max-w-md font-display text-3xl font-extrabold uppercase tracking-tight text-btm-navy">
        Pedidos y Logística
      </h1>
      <Link
        href="/pedidos"
        className="rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red"
      >
        Ingresar
      </Link>
    </div>
  );
}
