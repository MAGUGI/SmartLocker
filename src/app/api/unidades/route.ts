import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { criarUnidadeSchema } from "@/schemas/operacoes";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(undefined, async () => {
  const unidades = await prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(unidades);
});

export const POST = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const body = await request.json();
    const parsed = criarUnidadeSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    try {
      const unidade = await prisma.unidade.create({
        data: {
          nome: parsed.data.nome,
          codigo: parsed.data.codigo,
          endereco: parsed.data.endereco ?? null,
        },
      });
      return NextResponse.json(unidade, { status: 201 });
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2002: {
          status: 409,
          mensagem: "Já existe uma unidade cadastrada com este código",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);
