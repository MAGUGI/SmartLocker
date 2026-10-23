import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { aberturaEmergenciaSchema } from "@/schemas/armario";
import { executarAberturaEmergencia } from "@/server/usoService";

export const POST = comRotaAutenticada(
  "ADMIN",
  async (
    { user, ip, userAgent },
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const body = await request.json();
    const parsed = aberturaEmergenciaSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const resultado = await executarAberturaEmergencia(
      prisma,
      params.id,
      parsed.data.motivo,
      parsed.data.pecasAfetadas,
      { operadorId: user.id, ip, userAgent }
    );

    return NextResponse.json(resultado);
  }
);
