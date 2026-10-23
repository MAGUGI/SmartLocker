import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import {
  atualizarOrdemManutencaoSchema,
  criarOrdemManutencaoSchema,
} from "@/schemas/manutencao";
import {
  atualizarOrdemManutencao,
  criarOrdemManutencao,
  listarOrdensManutencao,
} from "@/server/manutencaoService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ADMIN", async () => {
  const ordens = await listarOrdensManutencao();
  return NextResponse.json(ordens);
});

export const POST = comRotaAutenticada(
  "ADMIN",
  async ({ user }, request: Request) => {
    const body = await request.json();
    const parsed = criarOrdemManutencaoSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const ordem = await criarOrdemManutencao(parsed.data, undefined, user.id);
    return NextResponse.json(ordem, { status: 201 });
  }
);

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async ({ user }, request: Request) => {
    const body = await request.json();
    const parsed = atualizarOrdemManutencaoSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const ordem = await atualizarOrdemManutencao(parsed.data, undefined, user.id);
    return NextResponse.json(ordem);
  }
);
