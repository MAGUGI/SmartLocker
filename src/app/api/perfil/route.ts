import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { comRotaAutenticada, ErroRegraDeNegocio } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { atualizarPerfilSchema } from "@/schemas/auth";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(undefined, async ({ user }) => {
  const dados = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      matricula: true,
      unidadeId: true,
      createdAt: true,
      usos: {
        include: { armario: true },
        orderBy: { checkIn: "desc" },
        take: 20,
      },
    },
  });

  return NextResponse.json(dados);
});

export const PATCH = comRotaAutenticada(
  undefined,
  async ({ user }, request: Request) => {
    const body = await request.json();
    const parsed = atualizarPerfilSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const usuarioAtual = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!usuarioAtual) {
      throw new ErroRegraDeNegocio(
        "USUARIO_NAO_ENCONTRADO",
        "Usuário não encontrado",
        404
      );
    }

    const dadosAtualizacao: { nome?: string; passwordHash?: string } = {};

    if (parsed.data.nome) {
      dadosAtualizacao.nome = parsed.data.nome;
    }

    if (parsed.data.novaSenha) {
      if (!parsed.data.senhaAtual) {
        throw new ErroRegraDeNegocio(
          "SENHA_ATUAL_OBRIGATORIA",
          "Informe a senha atual para definir uma nova senha",
          400
        );
      }

      const senhaConfere = await bcrypt.compare(
        parsed.data.senhaAtual,
        usuarioAtual.passwordHash
      );

      if (!senhaConfere) {
        throw new ErroRegraDeNegocio(
          "SENHA_ATUAL_INCORRETA",
          "A senha atual informada está incorreta",
          401
        );
      }

      dadosAtualizacao.passwordHash = await bcrypt.hash(
        parsed.data.novaSenha,
        10
      );
    }

    const atualizado = await prisma.user.update({
      where: { id: user.id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        matricula: true,
      },
    });

    return NextResponse.json(atualizado);
  }
);
