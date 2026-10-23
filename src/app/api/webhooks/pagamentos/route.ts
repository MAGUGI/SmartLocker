import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { webhookPagamentoPixSchema } from "@/schemas/operacoes";
import { processarWebhookPagamentoPix } from "@/server/tarifacaoService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = webhookPagamentoPixSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const usoAtualizado = await processarWebhookPagamentoPix(
      parsed.data,
      prisma
    );

    return NextResponse.json({
      recebido: true,
      uso: usoAtualizado,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
