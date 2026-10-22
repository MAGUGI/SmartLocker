import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DIAS_PADRAO_EXPURGO_TENTATIVAS = 2;
const DIAS_PADRAO_RETENCAO_HISTORICO = 90;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export async function verificarLimiteDeTaxa(
  identificador: string,
  limite: number,
  janelaEmSegundos: number,
  cliente: PrismaClient = prisma
): Promise<boolean> {
  const desde = new Date(Date.now() - janelaEmSegundos * 1000);

  const [contagem] = await Promise.all([
    cliente.tentativaAcesso.count({
      where: { identificador, criadoEm: { gte: desde } },
    }),
    cliente.tentativaAcesso.deleteMany({
      where: { identificador, criadoEm: { lt: desde } },
    }),
  ]);

  if (contagem >= limite) return false;

  await cliente.tentativaAcesso.create({ data: { identificador } });
  return true;
}

/**
 * MNT-11: Expurga tentativas de acesso com mais de N dias (padrão 2 dias)
 * e arquiva registros históricos de UsoArmario finalizados entre 90 e 180 dias.
 */
export async function executarExpurgoERetencao(
  cliente: PrismaClient = prisma,
  diasExpurgoTentativas: number = DIAS_PADRAO_EXPURGO_TENTATIVAS,
  diasRetencaoHistorico: number = DIAS_PADRAO_RETENCAO_HISTORICO
) {
  const limiteTentativas = new Date(
    Date.now() - diasExpurgoTentativas * MS_POR_DIA
  );
  const limiteArquivamento = new Date(
    Date.now() - diasRetencaoHistorico * MS_POR_DIA
  );

  const [tentativasRemovidas, usosArquivados] = await Promise.all([
    cliente.tentativaAcesso.deleteMany({
      where: { criadoEm: { lt: limiteTentativas } },
    }),
    cliente.usoArmario.updateMany({
      where: {
        checkOut: { not: null, lt: limiteArquivamento },
        arquivado: false,
      },
      data: { arquivado: true },
    }),
  ]);

  return {
    tentativasRemovidas: tentativasRemovidas.count,
    usosArquivados: usosArquivados.count,
    executadoEm: new Date().toISOString(),
  };
}
