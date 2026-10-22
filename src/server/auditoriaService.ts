import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface DadosRegistroAuditoria {
  operadorId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhes?: string | null;
  ip?: string;
  userAgent?: string;
}

/**
 * MNT-18: Serviço de trilha de auditoria imutável (append-only).
 * Expõe exclusivamente operações de inserção e leitura.
 */
export async function registrarAuditoria(
  dados: DadosRegistroAuditoria,
  cliente: PrismaClient | Prisma.TransactionClient = prisma
) {
  return cliente.auditoriaLog.create({
    data: {
      operadorId: dados.operadorId ?? null,
      acao: dados.acao,
      entidade: dados.entidade,
      entidadeId: dados.entidadeId ?? null,
      detalhes: dados.detalhes ?? null,
      ip: dados.ip ?? "desconhecido",
      userAgent: dados.userAgent ?? "desconhecido",
    },
  });
}

export async function listarAuditoria(
  cliente: PrismaClient = prisma,
  filtros: {
    entidade?: string;
    operadorId?: string;
    pagina?: number;
    tamanhoPagina?: number;
  } = {}
) {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const tamanhoPagina = Math.min(100, Math.max(1, filtros.tamanhoPagina ?? 20));

  const where: Prisma.AuditoriaLogWhereInput = {};
  if (filtros.entidade) where.entidade = filtros.entidade;
  if (filtros.operadorId) where.operadorId = filtros.operadorId;

  const [dados, total] = await Promise.all([
    cliente.auditoriaLog.findMany({
      where,
      include: {
        operador: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * tamanhoPagina,
      take: tamanhoPagina,
    }),
    cliente.auditoriaLog.count({ where }),
  ]);

  return {
    dados,
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
  };
}
