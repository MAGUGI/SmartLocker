import type { Prisma, PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/apiAuth";
import { registrarAuditoria } from "@/server/auditoriaService";
import { calcularTarifaPorTempoDeUso } from "@/server/tarifacaoService";
import { LIMITE_HORAS_ABANDONO } from "@/utils/date";

export const LIMITE_USOS_HIGIENIZACAO = 30;
export const LIMITE_DIAS_HIGIENIZACAO = 7;
export const DURACAO_PIN_HORAS = 4;

export function gerarPinTemporario(): string {
  const numero = Math.floor(100000 + Math.random() * 900000);
  return String(numero);
}

export function requerHigienizacaoPeriodica(
  usosDesdeHigienizacao: number,
  ultimaHigienizacaoEm: Date,
  agora: Date = new Date()
): boolean {
  if (usosDesdeHigienizacao >= LIMITE_USOS_HIGIENIZACAO) return true;
  const diasDesdeUltima =
    (agora.getTime() - new Date(ultimaHigienizacaoEm).getTime()) /
    (1000 * 60 * 60 * 24);
  return diasDesdeUltima >= LIMITE_DIAS_HIGIENIZACAO;
}

export function buscarUsoAtivo(
  cliente: PrismaClient | Prisma.TransactionClient,
  userId: string
) {
  return cliente.usoArmario.findFirst({
    where: { userId, checkOut: null },
    include: { armario: true },
  });
}

export async function realizarCheckIn(
  prisma: PrismaClient,
  userId: string,
  armarioId: string
) {
  return prisma.$transaction(async (tx) => {
    const usoAtivo = await buscarUsoAtivo(tx, userId);
    if (usoAtivo) {
      throw new ErroRegraDeNegocio(
        "ALUNO_JA_POSSUI_ARMARIO",
        "Você já possui um armário em uso. Faça o check-out antes de pegar outro.",
        409
      );
    }

    const atualizado = await tx.armario.updateMany({
      where: { id: armarioId, status: "LIVRE" },
      data: {
        status: "OCUPADO",
        totalCiclosAbertura: { increment: 1 },
        usosDesdeHigienizacao: { increment: 1 },
      },
    });
    if (atualizado.count === 0) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_INDISPONIVEL",
        "Este armário não está mais disponível",
        409
      );
    }

    const pinAcesso = gerarPinTemporario();
    const pinExpiraEm = new Date(Date.now() + DURACAO_PIN_HORAS * 60 * 60 * 1000);

    return tx.usoArmario.create({
      data: {
        userId,
        armarioId,
        pinAcesso,
        pinExpiraEm,
      },
      include: { armario: true },
    });
  });
}

export async function realizarCheckOut(prisma: PrismaClient, userId: string) {
  return prisma.$transaction(async (tx) => {
    const usoAtivo = await buscarUsoAtivo(tx, userId);
    if (!usoAtivo) {
      throw new ErroRegraDeNegocio(
        "SEM_ARMARIO_ATIVO",
        "Você não possui nenhum armário em uso",
        404
      );
    }

    const agora = new Date();
    const armario = usoAtivo.armario;
    const precisaHigienizar = requerHigienizacaoPeriodica(
      armario.usosDesdeHigienizacao ?? 0,
      armario.ultimaHigienizacaoEm ?? agora,
      agora
    );

    const proximoStatus = precisaHigienizar ? "MANUTENCAO" : "LIVRE";
    const modalidadeManutencao = precisaHigienizar ? "HIGIENIZACAO" : null;

    await tx.armario.update({
      where: { id: usoAtivo.armarioId },
      data: {
        status: proximoStatus,
        modalidadeManutencao,
      },
    });

    if (precisaHigienizar) {
      await tx.ordemManutencao.create({
        data: {
          armarioId: usoAtivo.armarioId,
          tipo: "HIGIENIZACAO",
          status: "ABERTA",
          descricao:
            "Higienização periódica obrigatória agendada automaticamente (30 usos ou 7 dias).",
        },
      });
    }

    const calculoTarifa = calcularTarifaPorTempoDeUso(
      usoAtivo.checkIn,
      agora,
      armario.tamanho
    );

    return tx.usoArmario.update({
      where: { id: usoAtivo.id },
      data: {
        checkOut: agora,
        pinAcesso: null,
        pinExpiraEm: null,
        valorCobrado: calculoTarifa.valorCobrado,
        statusPagamento: calculoTarifa.statusPagamento,
        pixTxId: calculoTarifa.pixTxId,
        pixCopiaECola: calculoTarifa.pixCopiaECola,
      },
      include: { armario: true },
    });
  });
}

/**
 * MNT-02: Liberação administrativa forçada com transação Prisma e justificativa.
 */
export async function forcarLiberacaoArmario(
  prisma: PrismaClient,
  armarioId: string,
  justificativa: string,
  metaAuditoria?: { operadorId?: string; ip?: string; userAgent?: string }
) {
  return prisma.$transaction(async (tx) => {
    const armario = await tx.armario.findUnique({ where: { id: armarioId } });
    if (!armario) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }

    const usoAtivo = await tx.usoArmario.findFirst({
      where: { armarioId, checkOut: null },
    });

    const agora = new Date();
    if (usoAtivo) {
      await tx.usoArmario.update({
        where: { id: usoAtivo.id },
        data: {
          checkOut: agora,
          pinAcesso: null,
          pinExpiraEm: null,
          justificativaLiberacao: justificativa,
        },
      });
    }

    const armarioAtualizado = await tx.armario.update({
      where: { id: armarioId },
      data: {
        status: "LIVRE",
        modalidadeManutencao: null,
      },
    });

    await registrarAuditoria(
      {
        operadorId: metaAuditoria?.operadorId,
        acao: "FORCAR_LIBERACAO_ARMARIO",
        entidade: "Armario",
        entidadeId: armarioId,
        detalhes: `Justificativa: ${justificativa}`,
        ip: metaAuditoria?.ip,
        userAgent: metaAuditoria?.userAgent,
      },
      tx
    );

    return {
      armario: armarioAtualizado,
      usoEncerradoId: usoAtivo?.id ?? null,
    };
  });
}

/**
 * MNT-01: Rotina de Abertura de Emergência com desocupação assistida
 * (MANUTENCAO_EMERGENCIAL) e geração automática de Ordem de Serviço.
 */
export async function executarAberturaEmergencia(
  prisma: PrismaClient,
  armarioId: string,
  motivo: string,
  pecasAfetadas?: string,
  metaAuditoria?: { operadorId?: string; ip?: string; userAgent?: string }
) {
  return prisma.$transaction(async (tx) => {
    const armario = await tx.armario.findUnique({ where: { id: armarioId } });
    if (!armario) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }

    const usoAtivo = await tx.usoArmario.findFirst({
      where: { armarioId, checkOut: null },
    });

    const agora = new Date();
    if (usoAtivo) {
      await tx.usoArmario.update({
        where: { id: usoAtivo.id },
        data: {
          checkOut: agora,
          pinAcesso: null,
          pinExpiraEm: null,
          justificativaLiberacao: `ABERTURA_EMERGENCIA: ${motivo}`,
        },
      });
    }

    const armarioAtualizado = await tx.armario.update({
      where: { id: armarioId },
      data: {
        status: "MANUTENCAO",
        modalidadeManutencao: "MANUTENCAO_EMERGENCIAL",
        totalCiclosAbertura: { increment: 1 },
      },
    });

    const ordemServico = await tx.ordemManutencao.create({
      data: {
        armarioId,
        tipo: "MANUTENCAO_EMERGENCIAL",
        status: "ABERTA",
        descricao: `Abertura de emergência executada: ${motivo}`,
        pecasTrocadas: pecasAfetadas ?? null,
      },
    });

    await registrarAuditoria(
      {
        operadorId: metaAuditoria?.operadorId,
        acao: "ABERTURA_EMERGENCIA",
        entidade: "Armario",
        entidadeId: armarioId,
        detalhes: `Motivo: ${motivo} | OS: ${ordemServico.id}`,
        ip: metaAuditoria?.ip,
        userAgent: metaAuditoria?.userAgent,
      },
      tx
    );

    return {
      armario: armarioAtualizado,
      ordemServico,
      usoDesocupadoId: usoAtivo?.id ?? null,
    };
  });
}

/**
 * MNT-03: Verifica e sinaliza armários retidos há mais de 3 horas (RN1).
 */
export async function verificarArmariosAbandonados(
  prisma: PrismaClient,
  limiteHoras: number = LIMITE_HORAS_ABANDONO
) {
  const limiteData = new Date(Date.now() - limiteHoras * 60 * 60 * 1000);

  const usosRetidos = await prisma.usoArmario.findMany({
    where: {
      checkOut: null,
      checkIn: { lte: limiteData },
    },
    include: {
      armario: true,
      user: { select: { id: true, nome: true, matricula: true } },
    },
  });

  if (usosRetidos.length > 0) {
    await prisma.usoArmario.updateMany({
      where: {
        id: { in: usosRetidos.map((u) => u.id) },
      },
      data: { abandonado: true },
    });
  }

  return {
    quantidadeRetidos: usosRetidos.length,
    armariosRetidos: usosRetidos.map((u) => ({
      usoId: u.id,
      armarioId: u.armarioId,
      numero: u.armario.numero,
      bloco: u.armario.bloco,
      aluno: u.user.nome,
      checkIn: u.checkIn,
    })),
    verificadoEm: new Date().toISOString(),
  };
}

/**
 * MNT-16: Valida credencial física (PIN de 6 dígitos) para acionamento do hardware.
 */
export async function validarAcessoHardwarePin(
  prisma: PrismaClient,
  armarioId: string,
  pin: string
) {
  const usoAtivo = await prisma.usoArmario.findFirst({
    where: { armarioId, checkOut: null },
    include: { armario: true },
  });

  if (!usoAtivo || !usoAtivo.pinAcesso) {
    throw new ErroRegraDeNegocio(
      "CREDENTIAL_INVALIDA",
      "Nenhuma sessão ativa com PIN configurada para este armário",
      401
    );
  }

  if (usoAtivo.pinExpiraEm && usoAtivo.pinExpiraEm.getTime() < Date.now()) {
    throw new ErroRegraDeNegocio(
      "PIN_EXPIRADO",
      "O PIN temporário expirou. Renove o acesso no aplicativo.",
      401
    );
  }

  if (usoAtivo.pinAcesso !== pin) {
    throw new ErroRegraDeNegocio(
      "PIN_INCORRETO",
      "PIN de acesso inválido",
      401
    );
  }

  const armario = await prisma.armario.update({
    where: { id: armarioId },
    data: { totalCiclosAbertura: { increment: 1 } },
  });

  return {
    autorizado: true,
    comandoHardware: "DESTRAVAR_SOLENOIDE",
    armarioId: armario.id,
    numero: armario.numero,
    bloco: armario.bloco,
    totalCiclosAbertura: armario.totalCiclosAbertura,
  };
}
