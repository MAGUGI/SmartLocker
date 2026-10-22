/**
 * SmartLocker — Verificacao Semanal de Integridade Referencial e Estado de Armarios (MNT-13)
 *
 * Detecta e opcionalmente corrige divergencias entre `Armario` e `UsoArmario`:
 *   1. Armario com status `OCUPADO`, mas sem nenhum `UsoArmario` ativo (`checkOut IS NULL`).
 *   2. Armario com status diferente de `OCUPADO`, porem possuindo `UsoArmario` ativo.
 *   3. Armario com multiplos registros `UsoArmario` simultaneamente em aberto.
 *
 * Uso:
 *   npx tsx scripts/verificar-integridade.ts [--reparar]
 */

import { PrismaClient, StatusArmario } from "@prisma/client";

export interface DivergenciaIntegridade {
  armarioId: string;
  numero: number;
  statusAtual: string;
  usosAtivosIds: string[];
  tipo:
    | "OCUPADO_SEM_LOCACAO_ATIVA"
    | "LOCACAO_ATIVA_COM_STATUS_DIVERGENTE"
    | "MULTIPLAS_LOCACOES_ATIVAS";
  descricao: string;
}

export function analisarIntegridadeArmarios(
  armarios: Array<{
    id: string;
    numero: number;
    status: string;
    usos: Array<{ id: string; checkOut: Date | null }>;
  }>,
): DivergenciaIntegridade[] {
  const divergencias: DivergenciaIntegridade[] = [];

  for (const armario of armarios) {
    const usosAtivos = armario.usos.filter((u) => u.checkOut === null);

    if (usosAtivos.length > 1) {
      divergencias.push({
        armarioId: armario.id,
        numero: armario.numero,
        statusAtual: armario.status,
        usosAtivosIds: usosAtivos.map((u) => u.id),
        tipo: "MULTIPLAS_LOCACOES_ATIVAS",
        descricao: `Armario #${armario.numero} possui ${usosAtivos.length} locacoes simultaneamente em aberto.`,
      });
      continue;
    }

    if (armario.status === "OCUPADO" && usosAtivos.length === 0) {
      divergencias.push({
        armarioId: armario.id,
        numero: armario.numero,
        statusAtual: armario.status,
        usosAtivosIds: [],
        tipo: "OCUPADO_SEM_LOCACAO_ATIVA",
        descricao: `Armario #${armario.numero} consta como OCUPADO, mas nao possui UsoArmario ativo.`,
      });
    } else if (armario.status !== "OCUPADO" && usosAtivos.length === 1) {
      divergencias.push({
        armarioId: armario.id,
        numero: armario.numero,
        statusAtual: armario.status,
        usosAtivosIds: [usosAtivos[0].id],
        tipo: "LOCACAO_ATIVA_COM_STATUS_DIVERGENTE",
        descricao: `Armario #${armario.numero} possui locacao ativa (${usosAtivos[0].id}), mas seu status e ${armario.status}.`,
      });
    }
  }

  return divergencias;
}

async function executarVerificacao() {
  const deveReparar = process.argv.includes("--reparar");
  const prisma = new PrismaClient();

  try {
    const armarios = await prisma.armario.findMany({
      include: {
        usos: {
          where: { checkOut: null },
          select: { id: true, checkOut: true },
        },
      },
      orderBy: { numero: "asc" },
    });

    const divergencias = analisarIntegridadeArmarios(armarios);

    if (divergencias.length === 0) {
      console.log(
        `[OK] Integridade verificada em ${armarios.length} armarios. Nenhuma divergencia encontrada.`,
      );
      return;
    }

    console.warn(`[ALERTA] Encontradas ${divergencias.length} divergencias de integridade:`);
    for (const div of divergencias) {
      console.warn(` - [${div.tipo}] ${div.descricao}`);
    }

    if (!deveReparar) {
      console.info("Execute com --reparar para reconciliar os status automaticamente.");
      process.exitCode = 1;
      return;
    }

    for (const div of divergencias) {
      if (div.tipo === "OCUPADO_SEM_LOCACAO_ATIVA") {
        await prisma.armario.update({
          where: { id: div.armarioId },
          data: { status: StatusArmario.LIVRE },
        });
        console.log(`[REPARADO] Armario #${div.numero} restaurado para LIVRE.`);
      } else if (div.tipo === "LOCACAO_ATIVA_COM_STATUS_DIVERGENTE") {
        await prisma.armario.update({
          where: { id: div.armarioId },
          data: { status: StatusArmario.OCUPADO },
        });
        console.log(`[REPARADO] Armario #${div.numero} sincronizado para OCUPADO.`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  executarVerificacao().catch((err) => {
    console.error("[ERRO] Falha ao verificar integridade:", err);
    process.exit(1);
  });
}
