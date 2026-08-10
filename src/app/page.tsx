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
      <Image
        src="/brand/btm-horizontal-tagline.png"
        alt="BTM Nutrición Animal"
        width={400}
        height={102}
        className="h-auto w-70 sm:w-100"
        priority
      />

      <LoginForm next={next ?? "/pedidos"} />
    </div>
  );
}
