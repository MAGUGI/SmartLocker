import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const armarioId = searchParams.get("armarioId");
    const ativo = searchParams.get("ativo");
    const abandonado = searchParams.get("abandonado");
    const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
    const tamanhoPagina = Math.min(
      100,
      Math.max(1, Number(searchParams.get("tamanhoPagina")) || 10)
    );

    const where: Prisma.UsoArmarioWhereInput = {};
    if (userId) where.userId = userId;
    if (armarioId) where.armarioId = armarioId;
    if (ativo === "true") where.checkOut = null;
    if (ativo === "false") where.checkOut = { not: null };
    if (abandonado === "true") where.abandonado = true;

    const [dados, total] = await Promise.all([
      prisma.usoArmario.findMany({
        where,
        include: {
          user: { select: { id: true, nome: true, matricula: true } },
          armario: {
            select: {
              id: true,
              numero: true,
              bloco: true,
              tamanho: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { checkIn: "desc" },
        skip: (pagina - 1) * tamanhoPagina,
        take: tamanhoPagina,
      }),
      prisma.usoArmario.count({ where }),
    ]);

    return NextResponse.json({
      dados,
      total,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
    });
  }
);
