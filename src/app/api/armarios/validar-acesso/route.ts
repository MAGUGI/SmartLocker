import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { validarAcessoPinSchema } from "@/schemas/armario";
import { validarAcessoHardwarePin } from "@/server/usoService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validarAcessoPinSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const resultado = await validarAcessoHardwarePin(
      prisma,
      parsed.data.armarioId,
      parsed.data.pin
    );

    return NextResponse.json(resultado);
  } catch (error) {
    return handleApiError(error);
  }
}
