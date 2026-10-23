import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { higienizarArmarioSchema } from "@/schemas/manutencao";
import { concluirHigienizacaoArmario } from "@/server/manutencaoService";

export const POST = comRotaAutenticada(
  "ADMIN",
  async (
    { user },
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const body = await request.json().catch(() => ({}));
    const parsed = higienizarArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const armario = await concluirHigienizacaoArmario(
      params.id,
      parsed.data.observacoes,
      prisma,
      user.id
    );

    return NextResponse.json(armario);
  }
);
