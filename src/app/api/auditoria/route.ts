import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { listarAuditoria } from "@/server/auditoriaService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const { searchParams } = new URL(request.url);
    const entidade = searchParams.get("entidade") || undefined;
    const operadorId = searchParams.get("operadorId") || undefined;
    const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
    const tamanhoPagina = Math.min(
      100,
      Math.max(1, Number(searchParams.get("tamanhoPagina")) || 20)
    );

    const resultado = await listarAuditoria(prisma, {
      entidade,
      operadorId,
      pagina,
      tamanhoPagina,
    });

    return NextResponse.json(resultado);
  }
);
