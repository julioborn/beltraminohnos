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
  "/produccion",
];

// Rol "limitado" (ej. vendedores externos como Rural Mas): solo pueden
// cargar notas de pedido nuevas y ver el listado de las suyas — nada más.
const LIMITADO_HOME = "/mis-notas";
const LIMITADO_ALLOWED_PREFIXES = ["/mis-notas", "/pedidos/nuevo", "/consignaciones/mi-sucursal"];

// Rol "contable": solo puede analizar el módulo de consignaciones (sucursales),
// nada más del resto de la app.
const CONTABLE_HOME = "/consignaciones";
const CONTABLE_ALLOWED_PREFIXES = ["/consignaciones"];

// Rol "operador" (piso de fábrica): solo carga la planilla de producción
// de su turno, nada más del resto de la app.
const OPERADOR_HOME = "/produccion/cargar";
const OPERADOR_ALLOWED_PREFIXES = ["/produccion/cargar"];

// Rol "produccion" (ej. Pablo Althaus): solo puede ver el panel de
// administración de Producción, nada más del resto de la app.
const PRODUCCION_HOME = "/produccion";
const PRODUCCION_ALLOWED_PREFIXES = ["/produccion"];

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
    const isOperador = profile?.role === "operador";
    const isProduccion = profile?.role === "produccion";

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

    if (isOperador) {
      if (path === "/") {
        return NextResponse.redirect(new URL(OPERADOR_HOME, request.url));
      }
      const isAllowed = OPERADOR_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
      if (isProtected && !isAllowed) {
        return NextResponse.redirect(new URL(OPERADOR_HOME, request.url));
      }
    }

    if (isProduccion) {
      if (path === "/") {
        return NextResponse.redirect(new URL(PRODUCCION_HOME, request.url));
      }
      const isAllowed = PRODUCCION_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
      if (isProtected && !isAllowed) {
        return NextResponse.redirect(new URL(PRODUCCION_HOME, request.url));
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
