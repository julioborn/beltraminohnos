import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/inicio",
  "/pedidos",
  "/cercanos",
  "/repartos",
  "/cotizaciones",
  "/productos",
  "/personal",
  "/reportes",
  "/estadisticas",
  "/mis-notas",
  "/consignaciones",
];

// Rol "limitado" (ej. vendedores externos como Rural Mas): solo pueden
// cargar notas de pedido nuevas y ver el listado de las suyas — nada más.
const LIMITADO_HOME = "/mis-notas";
const LIMITADO_ALLOWED_PREFIXES = ["/mis-notas", "/pedidos/nuevo"];

// Rol "contable": solo puede analizar el módulo de consignaciones (sucursales),
// nada más del resto de la app.
const CONTABLE_HOME = "/consignaciones";
const CONTABLE_ALLOWED_PREFIXES = ["/consignaciones"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected && !user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isLimitado = profile?.role === "limitado";
    const isContable = profile?.role === "contable";

    if (isLimitado) {
      if (path === "/") {
        return NextResponse.redirect(new URL(LIMITADO_HOME, request.url));
      }
      const isAllowed = LIMITADO_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
      if (isProtected && !isAllowed) {
        return NextResponse.redirect(new URL(LIMITADO_HOME, request.url));
      }
    }

    if (isContable) {
      if (path === "/") {
        return NextResponse.redirect(new URL(CONTABLE_HOME, request.url));
      }
      const isAllowed = CONTABLE_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
      if (isProtected && !isAllowed) {
        return NextResponse.redirect(new URL(CONTABLE_HOME, request.url));
      }
    }
  }

  if (path === "/" && user) {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
