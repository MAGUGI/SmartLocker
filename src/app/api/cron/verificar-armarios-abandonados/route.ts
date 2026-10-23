import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { verificarArmariosAbandonados } from "@/server/usoService";

export const dynamic = "force-dynamic";

async function processarVerificacaoAbandono() {
  try {
    const resultado = await verificarArmariosAbandonados(prisma);
    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return processarVerificacaoAbandono();
}

export async function POST() {
  return processarVerificacaoAbandono();
}
