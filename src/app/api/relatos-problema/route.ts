import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { criarRelatoProblemaSchema } from "@/schemas/manutencao";
import {
  criarRelatoProblema,
  listarRelatosProblema,
} from "@/server/manutencaoService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const { searchParams } = new URL(request.url);
    const pendentes = searchParams.get("pendentes") === "true";
    const relatos = await listarRelatosProblema(pendentes);
    return NextResponse.json(relatos);
  }
);

export const POST = comRotaAutenticada(
  undefined,
  async ({ user }, request: Request) => {
    const body = await request.json();
    const parsed = criarRelatoProblemaSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const relato = await criarRelatoProblema(user.id, parsed.data);
    return NextResponse.json(relato, { status: 201 });
  }
);
