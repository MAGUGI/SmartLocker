import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { comRotaAutenticada, ErroRegraDeNegocio } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { atualizarUsuarioAdminSchema } from "@/schemas/auth";
import { registrarAuditoria } from "@/server/auditoriaService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request) => {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca")?.trim();
    const unidadeId = searchParams.get("unidadeId");
    const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
    const tamanhoPagina = Math.min(
      100,
      Math.max(1, Number(searchParams.get("tamanhoPagina")) || 10)
    );

    const where: Prisma.UserWhereInput = {};
    if (unidadeId) where.unidadeId = unidadeId;
    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { email: { contains: busca, mode: "insensitive" } },
        { matricula: { contains: busca, mode: "insensitive" } },
      ];
    }

    const [dados, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          matricula: true,
          bloqueado: true,
          anonimizado: true,
          unidadeId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (pagina - 1) * tamanhoPagina,
        take: tamanhoPagina,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      dados,
      total,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
    });
  }
);

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async ({ user, ip, userAgent }, request: Request) => {
    const body = await request.json();
    const parsed = atualizarUsuarioAdminSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const alvo = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!alvo) {
      throw new ErroRegraDeNegocio(
        "USUARIO_NAO_ENCONTRADO",
        "Usuário não encontrado",
        404
      );
    }

    const data: Prisma.UserUpdateInput = {};
    if (parsed.data.nome !== undefined) data.nome = parsed.data.nome;
    if (parsed.data.bloqueado !== undefined)
      data.bloqueado = parsed.data.bloqueado;
    if (parsed.data.unidadeId !== undefined) {
      data.unidade = parsed.data.unidadeId
        ? { connect: { id: parsed.data.unidadeId } }
        : { disconnect: true };
    }
    if (parsed.data.novaSenha) {
      data.passwordHash = await bcrypt.hash(parsed.data.novaSenha, 10);
    }

    const atualizado = await prisma.user.update({
      where: { id: parsed.data.userId },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        matricula: true,
        bloqueado: true,
        anonimizado: true,
        unidadeId: true,
        createdAt: true,
      },
    });

    await registrarAuditoria({
      operadorId: user.id,
      acao: "GERENCIAR_USUARIO",
      entidade: "User",
      entidadeId: atualizado.id,
      detalhes: `Bloqueado: ${atualizado.bloqueado} | Senha redefinida: ${Boolean(parsed.data.novaSenha)}`,
      ip,
      userAgent,
    });

    return NextResponse.json(atualizado);
  }
);
