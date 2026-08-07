import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-white px-6 py-24">
      <Image
        src="/brand/btm-horizontal-tagline.png"
        alt="BTM Nutrición Animal"
        width={320}
        height={84}
        priority
      />
      <LoginForm next={next ?? "/pedidos"} />
    </div>
  );
}
