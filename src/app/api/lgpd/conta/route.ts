import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { anonimizarContaLgpd } from "@/server/lgpdService";

export const DELETE = comRotaAutenticada(undefined, async ({ user }) => {
  const resultado = await anonimizarContaLgpd(user.id, prisma);
  return NextResponse.json(resultado);
});
