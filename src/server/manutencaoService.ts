import type { PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import type {
  AtualizarOrdemManutencaoInput,
  CriarInspecaoFisicaInput,
  CriarOrdemManutencaoInput,
  CriarRelatoProblemaInput,
} from "@/schemas/manutencao";
import { registrarAuditoria } from "@/server/auditoriaService";

export const LIMIAR_INSPECAO_PREVENTIVA_CICLOS = 1000;
export const LIMIAR_SUBSTITUICAO_SOLENOIDE_CICLOS = 5000;

/**
 * MNT-07: Avalia o nível de desgaste mecânico da trava/solenoide por ciclos de abertura.
 */
export function avaliarDesgasteSolenoide(totalCiclosAbertura: number): {
  nivelAlerta: "NORMAL" | "PREVENTIVA" | "CRITICO";
  mensagem: string | null;
} {
  if (totalCiclosAbertura >= LIMIAR_SUBSTITUICAO_SOLENOIDE_CICLOS) {
    return {
      nivelAlerta: "CRITICO",
      mensagem: `Fadiga crítica de solenoide (${totalCiclosAbertura} ciclos >= 5.000). Substituição imediata recomendada.`,
    };
  }

  if (totalCiclosAbertura >= LIMIAR_INSPECAO_PREVENTIVA_CICLOS) {
    return {
      nivelAlerta: "PREVENTIVA",
      mensagem: `Inspeção Mecânica Preventiva necessária (${totalCiclosAbertura} ciclos >= 1.000).`,
    };
  }

  return { nivelAlerta: "NORMAL", mensagem: null };
}

/**
 * MNT-04: Registra relato de problema no armário enviado pelo aluno.
 */
export async function criarRelatoProblema(
  userId: string,
  dados: CriarRelatoProblemaInput,
  cliente: PrismaClient = prisma
) {
  const armario = await cliente.armario.findUnique({
    where: { id: dados.armarioId },
  });
  if (!armario) {
    throw new ErroRegraDeNegocio(
      "ARMARIO_NAO_ENCONTRADO",
      "Armário não encontrado",
      404
    );
  }

  const prioridadeAlta =
    dados.categoria === "TRAVA_EMPERRADA" ||
    dados.categoria === "PORTA_DANIFICADA";

  return cliente.relatoProblemaArmario.create({
    data: {
      armarioId: dados.armarioId,
      userId,
      categoria: dados.categoria,
      descricao: dados.descricao,
      prioridadeAlta,
    },
    include: {
      armario: {
        select: { id: true, numero: true, bloco: true, tamanho: true, status: true },
      },
      user: { select: { id: true, nome: true, matricula: true } },
    },
  });
}

export async function listarRelatosProblema(
  apenasPendentes: boolean = false,
  cliente: PrismaClient = prisma
) {
  return cliente.relatoProblemaArmario.findMany({
    where: apenasPendentes ? { resolvido: false } : {},
    include: {
      armario: {
        select: { id: true, numero: true, bloco: true, tamanho: true, status: true },
      },
      user: { select: { id: true, nome: true, matricula: true } },
    },
    orderBy: [{ resolvido: "asc" }, { prioridadeAlta: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * MNT-05: Cria Ordem de Serviço e coloca o armário em MANUTENCAO caso esteja LIVRE.
 */
export async function criarOrdemManutencao(
  dados: CriarOrdemManutencaoInput,
  cliente: PrismaClient = prisma,
  operadorId?: string
) {
  return cliente.$transaction(async (tx) => {
    const armario = await tx.armario.findUnique({
      where: { id: dados.armarioId },
    });
    if (!armario) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }

    if (armario.status === "LIVRE") {
      await tx.armario.update({
        where: { id: dados.armarioId },
        data: {
          status: "MANUTENCAO",
          modalidadeManutencao:
            dados.tipo === "HIGIENIZACAO" ? "HIGIENIZACAO" : "PADRAO",
        },
      });
    }

    const ordem = await tx.ordemManutencao.create({
      data: {
        armarioId: dados.armarioId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        pecasTrocadas: dados.pecasTrocadas ?? null,
        custo: dados.custo ?? 0,
      },
      include: { armario: true },
    });

    await registrarAuditoria(
      {
        operadorId,
        acao: "CRIAR_ORDEM_MANUTENCAO",
        entidade: "OrdemManutencao",
        entidadeId: ordem.id,
        detalhes: `Tipo: ${dados.tipo} | Armário: ${armario.numero} (${armario.bloco})`,
      },
      tx
    );

    return ordem;
  });
}

/**
 * MNT-05: Atualiza Ordem de Serviço e valida obrigatoriedade de teste antes de reativar armário.
 */
export async function atualizarOrdemManutencao(
  dados: AtualizarOrdemManutencaoInput,
  cliente: PrismaClient = prisma,
  operadorId?: string
) {
  return cliente.$transaction(async (tx) => {
    const ordemAtual = await tx.ordemManutencao.findUnique({
      where: { id: dados.ordemId },
      include: { armario: true },
    });

    if (!ordemAtual) {
      throw new ErroRegraDeNegocio(
        "ORDEM_NAO_ENCONTRADA",
        "Ordem de serviço não encontrada",
        404
      );
    }

    const testadoFinal =
      dados.testadoAntesReativar ?? ordemAtual.testadoAntesReativar;

    if (dados.reativarArmario && !testadoFinal) {
      throw new ErroRegraDeNegocio(
        "TESTE_OBRIGATORIO_PARA_REATIVAR",
        "O armário só pode ser reativado após a confirmação de teste operacional da trava",
        422
      );
    }

    const novoStatus =
      dados.status ?? (dados.reativarArmario ? "CONCLUIDA" : ordemAtual.status);

    const ordemAtualizada = await tx.ordemManutencao.update({
      where: { id: dados.ordemId },
      data: {
        status: novoStatus,
        pecasTrocadas: dados.pecasTrocadas ?? ordemAtual.pecasTrocadas,
        custo: dados.custo ?? ordemAtual.custo,
        testadoAntesReativar: testadoFinal,
        concluidaEm:
          novoStatus === "CONCLUIDA" ? new Date() : ordemAtual.concluidaEm,
      },
      include: { armario: true },
    });

    if (dados.reativarArmario) {
      await tx.armario.update({
        where: { id: ordemAtual.armarioId },
        data: {
          status: "LIVRE",
          modalidadeManutencao: null,
        },
      });

      await tx.relatoProblemaArmario.updateMany({
        where: { armarioId: ordemAtual.armarioId, resolvido: false },
        data: { resolvido: true },
      });
    }

    await registrarAuditoria(
      {
        operadorId,
        acao: "ATUALIZAR_ORDEM_MANUTENCAO",
        entidade: "OrdemManutencao",
        entidadeId: ordemAtual.id,
        detalhes: `Status: ${novoStatus} | Reativado: ${Boolean(dados.reativarArmario)}`,
      },
      tx
    );

    return ordemAtualizada;
  });
}

export async function listarOrdensManutencao(cliente: PrismaClient = prisma) {
  return cliente.ordemManutencao.findMany({
    include: {
      armario: {
        select: {
          id: true,
          numero: true,
          bloco: true,
          tamanho: true,
          status: true,
          totalCiclosAbertura: true,
          usosDesdeHigienizacao: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * MNT-09: Executa higienização periódica via leitura de QR Code e libera o armário.
 */
export async function concluirHigienizacaoArmario(
  armarioId: string,
  observacoes?: string,
  cliente: PrismaClient = prisma,
  operadorId?: string
) {
  return cliente.$transaction(async (tx) => {
    const armario = await tx.armario.findUnique({ where: { id: armarioId } });
    if (!armario) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }

    const agora = new Date();
    const armarioAtualizado = await tx.armario.update({
      where: { id: armarioId },
      data: {
        usosDesdeHigienizacao: 0,
        ultimaHigienizacaoEm: agora,
        ...(armario.status === "MANUTENCAO" &&
        armario.modalidadeManutencao === "HIGIENIZACAO"
          ? { status: "LIVRE", modalidadeManutencao: null }
          : {}),
      },
    });

    await tx.ordemManutencao.updateMany({
      where: {
        armarioId,
        tipo: "HIGIENIZACAO",
        status: { not: "CONCLUIDA" },
      },
      data: {
        status: "CONCLUIDA",
        testadoAntesReativar: true,
        concluidaEm: agora,
      },
    });

    await registrarAuditoria(
      {
        operadorId,
        acao: "CONCLUIR_HIGIENIZACAO",
        entidade: "Armario",
        entidadeId: armarioId,
        detalhes: observacoes ?? "Higienização periódica concluída via QR Code",
      },
      tx
    );

    return armarioAtualizado;
  });
}

/**
 * MNT-10: Calendário de inspeções físicas preventivas por bloco.
 */
export async function criarInspecaoFisica(
  dados: CriarInspecaoFisicaInput,
  cliente: PrismaClient = prisma
) {
  return cliente.inspecaoFisica.create({
    data: {
      bloco: dados.bloco,
      dataProgramada: new Date(dados.dataProgramada),
      alinhamentoOk: dados.alinhamentoOk,
      vedacaoOk: dados.vedacaoOk,
      sensoresOk: dados.sensoresOk,
      observacoes: dados.observacoes ?? null,
      concluida: dados.concluida,
    },
  });
}

export async function listarInspecoesFisicas(cliente: PrismaClient = prisma) {
  return cliente.inspecaoFisica.findMany({
    orderBy: { dataProgramada: "asc" },
  });
}
