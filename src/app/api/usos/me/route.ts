import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { buscarUsoAtivo } from "@/server/usoService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ALUNO", async ({ user }, request: Request) => {
  if (request?.url) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("historico") === "true") {
      const historico = await prisma.usoArmario.findMany({
        where: { userId: user.id },
        include: { armario: true },
        orderBy: { checkIn: "desc" },
        take: 20,
      });
      return NextResponse.json(historico);
    }
  }

  const usoAtivo = await buscarUsoAtivo(prisma, user.id);
  return NextResponse.json(usoAtivo);
});
