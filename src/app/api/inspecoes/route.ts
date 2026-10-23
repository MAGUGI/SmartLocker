import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { criarInspecaoFisicaSchema } from "@/schemas/manutencao";
import {
  criarInspecaoFisica,
  listarInspecoesFisicas,
} from "@/server/manutencaoService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ADMIN", async () => {
  const inspecoes = await listarInspecoesFisicas();
  return NextResponse.json(inspecoes);
});

export const POST = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const body = await request.json();
    const parsed = criarInspecaoFisicaSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const inspecao = await criarInspecaoFisica(parsed.data);
    return NextResponse.json(inspecao, { status: 201 });
  }
);
