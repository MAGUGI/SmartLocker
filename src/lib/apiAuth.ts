import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { extrairPrimeiroIp } from "@/utils/extrairPrimeiroIp";

export class ApiAuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export class ErroRegraDeNegocio extends Error {
  constructor(
    public codigo: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ErroRegraDeNegocio";
  }
}

export async function requireUser(role?: Role) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiAuthError(401, "Não autenticado");
  }

  if (role && session.user.role !== role) {
    throw new ApiAuthError(403, "Sem permissão para esta ação");
  }

  return session.user;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ErroRegraDeNegocio) {
    return NextResponse.json(
      { error: error.message, codigo: error.codigo },
      { status: error.status }
    );
  }

  console.error(
    error instanceof Error
      ? { name: error.name, message: error.message }
      : error
  );

  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 }
  );
}

export type UsuarioAutenticado = Awaited<ReturnType<typeof requireUser>>;

export interface ContextoRequisicaoAutenticada {
  user: UsuarioAutenticado;
  ip: string;
  userAgent: string;
}

function extrairMetadadosRequisicao(primeiroArgumento: unknown): {
  ip: string;
  userAgent: string;
} {
  if (
    primeiroArgumento &&
    typeof primeiroArgumento === "object" &&
    "headers" in primeiroArgumento &&
    primeiroArgumento.headers instanceof Headers
  ) {
    const headers = primeiroArgumento.headers;
    return {
      ip: extrairPrimeiroIp(headers.get("x-forwarded-for")),
      userAgent: headers.get("user-agent") || "desconhecido",
    };
  }

  return { ip: "desconhecido", userAgent: "desconhecido" };
}

export function comRotaAutenticada<Args extends unknown[]>(
  papel: Role | undefined,
  handler: (
    contexto: ContextoRequisicaoAutenticada,
    ...args: Args
  ) => Promise<NextResponse>
) {
  return async (...args: Args) => {
    try {
      const user = await requireUser(papel);
      const { ip, userAgent } = extrairMetadadosRequisicao(args[0]);
      return await handler({ user, ip, userAgent }, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
