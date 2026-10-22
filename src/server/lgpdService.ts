import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/server/auditoriaService";

/**
 * MNT-19: Exporta todos os dados pessoais e histórico de uso do titular em formato JSON (LGPD).
 */
export async function exportarDadosPessoaisLgpd(
  userId: string,
  cliente: PrismaClient = prisma
) {
  const usuario = await cliente.user.findUnique({
    where: { id: userId },
    include: {
      unidade: { select: { id: true, nome: true, codigo: true } },
      usos: {
        include: {
          armario: { select: { numero: true, bloco: true, tamanho: true } },
        },
        orderBy: { checkIn: "desc" },
      },
      relatos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!usuario) {
    throw new ErroRegraDeNegocio(
      "USUARIO_NAO_ENCONTRADO",
      "Usuário não encontrado",
      404
    );
  }

  return {
    titular: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      matricula: usuario.matricula,
      papel: usuario.role,
      unidade: usuario.unidade,
      cadastradoEm: usuario.createdAt,
    },
    historicoDeUsos: usuario.usos.map((uso) => ({
      id: uso.id,
      armario: uso.armario,
      checkIn: uso.checkIn,
      checkOut: uso.checkOut,
      valorCobrado: uso.valorCobrado,
      statusPagamento: uso.statusPagamento,
    })),
    relatosDeAvaria: usuario.relatos.map((relato) => ({
      id: relato.id,
      categoria: relato.categoria,
      descricao: relato.descricao,
      resolvido: relato.resolvido,
      criadoEm: relato.createdAt,
    })),
    exportadoEm: new Date().toISOString(),
    baseLegal: "LGPD - Lei nº 13.709/2018 (Art. 18, II e V - Portabilidade e Acesso)",
  };
}

/**
 * MNT-19: Anonimiza os dados pessoais do titular em caso de exclusão de conta,
 * preservando a integridade estatística do histórico de UsoArmario.
 */
export async function anonimizarContaLgpd(
  userId: string,
  cliente: PrismaClient = prisma
) {
  return cliente.$transaction(async (tx) => {
    const usoAtivo = await tx.usoArmario.findFirst({
      where: { userId, checkOut: null },
    });

    if (usoAtivo) {
      throw new ErroRegraDeNegocio(
        "POSSUI_ARMARIO_EM_USO",
        "Libere o armário em uso antes de solicitar a exclusão/anonimização da conta",
        409
      );
    }

    const hashAnonimo = crypto
      .createHash("sha256")
      .update(`${userId}-${Date.now()}`)
      .digest("hex")
      .slice(0, 12);

    const usuarioAnonimizado = await tx.user.update({
      where: { id: userId },
      data: {
        nome: `Titular Anonimizado #${hashAnonimo.slice(0, 6)}`,
        email: `anonimizado.${hashAnonimo}@lgpd.smartlocker.local`,
        matricula: null,
        passwordHash: "CONTA_ANONIMIZADA_LGPD",
        anonimizado: true,
        bloqueado: true,
      },
    });

    await registrarAuditoria(
      {
        operadorId: userId,
        acao: "ANONIMIZAR_CONTA_LGPD",
        entidade: "User",
        entidadeId: userId,
        detalhes: "Dados cadastrais anonimizados conforme solicitação do titular (RNF06/LGPD).",
      },
      tx
    );

    return {
      id: usuarioAnonimizado.id,
      anonimizado: usuarioAnonimizado.anonimizado,
      mensagem:
        "Conta anonimizada com sucesso. Seus dados identificáveis foram removidos e o histórico estatístico foi desvinculado.",
    };
  });
}
