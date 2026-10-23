import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import {
  createArmarioSchema,
  statusArmarioSchema,
  tamanhoSchema,
} from "@/schemas/armario";
import { registrarAuditoria } from "@/server/auditoriaService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  undefined,
  async (_contexto, request: Request) => {
    const { searchParams } = new URL(request.url);
    const bloco = searchParams.get("bloco");
    const unidadeId = searchParams.get("unidadeId");
    const tamanho = tamanhoSchema.safeParse(searchParams.get("tamanho"));
    const status = statusArmarioSchema.safeParse(searchParams.get("status"));

    const where: Prisma.ArmarioWhereInput = {};
    if (bloco) where.bloco = bloco;
    if (unidadeId) where.unidadeId = unidadeId;
    if (tamanho.success) where.tamanho = tamanho.data;
    if (status.success) where.status = status.data;

    const armarios = await prisma.armario.findMany({
      where,
      orderBy: [{ bloco: "asc" }, { numero: "asc" }],
    });

    return NextResponse.json(armarios);
  }
);

export const POST = comRotaAutenticada(
  "ADMIN",
  async ({ user, ip, userAgent }, request: Request) => {
    const body = await request.json();
    const parsed = createArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    try {
      const armario = await prisma.armario.create({ data: parsed.data });

      await registrarAuditoria({
        operadorId: user.id,
        acao: "CRIAR_ARMARIO",
        entidade: "Armario",
        entidadeId: armario.id,
        detalhes: `Armário #${armario.numero} (${armario.bloco}) - Tam. ${armario.tamanho}`,
        ip,
        userAgent,
      });

      return NextResponse.json(armario, { status: 201 });
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2002: {
          status: 409,
          mensagem: "Já existe um armário com esse número neste bloco",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);
