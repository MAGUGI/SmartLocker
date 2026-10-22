import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { exportarDadosPessoaisLgpd } from "@/server/lgpdService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(undefined, async ({ user }) => {
  const pacoteDados = await exportarDadosPessoaisLgpd(user.id, prisma);
  return NextResponse.json(pacoteDados);
});
