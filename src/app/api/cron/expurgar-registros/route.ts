import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { executarExpurgoERetencao } from "@/server/limiteDeTaxaService";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const resultado = await executarExpurgoERetencao(prisma);
    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}
