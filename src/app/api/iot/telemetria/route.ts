import { NextResponse } from "next/server";

import { comRotaAutenticada, handleApiError } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { telemetriaInputSchema } from "@/schemas/operacoes";
import {
  listarTelemetriaRecente,
  registrarTelemetriaArmario,
} from "@/server/telemetriaService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ADMIN", async () => {
  const leituras = await listarTelemetriaRecente(30);
  return NextResponse.json(leituras);
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = telemetriaInputSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const resultado = await registrarTelemetriaArmario(parsed.data);
    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
