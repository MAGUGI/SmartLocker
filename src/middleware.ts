import { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const REGRAS_DE_ACESSO: { prefixo: string; papel?: Role }[] = [
  { prefixo: "/dashboard", papel: "ADMIN" },
  { prefixo: "/armarios", papel: "ALUNO" },
  { prefixo: "/meu-armario", papel: "ALUNO" },
  { prefixo: "/perfil" },
];

function resolverRedirecionamento(pathname: string, papel: Role): string | null {
  const regra = REGRAS_DE_ACESSO.find((r) => pathname.startsWith(r.prefixo));
  if (!regra || !regra.papel || papel === regra.papel) return null;
  return regra.papel === "ADMIN" ? "/armarios" : "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    const tinhaCookieDeSessao = request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("session-token"));
    if (tinhaCookieDeSessao) {
      loginUrl.searchParams.set("expirado", "1");
    }

    return NextResponse.redirect(loginUrl);
  }

  const destino = resolverRedirecionamento(pathname, token.role);
  if (destino) {
    return NextResponse.redirect(new URL(destino, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/armarios/:path*",
    "/meu-armario/:path*",
    "/perfil/:path*",
  ],
};
