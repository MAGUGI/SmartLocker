import type { PrismaClient, Tamanho } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const FRANQUIA_GRATUITA_HORAS = 3;

export const TARIFA_HORA_ADICIONAL_POR_TAMANHO: Record<Tamanho, number> = {
  P: 5,
  M: 8,
  G: 12,
};

export interface ResultadoCalculoTarifa {
  horasTotais: number;
  horasExcedentes: number;
  valorCobrado: number;
  statusPagamento: "ISENTO" | "PENDENTE";
  pixTxId: string | null;
  pixCopiaECola: string | null;
}

/**
 * MNT-22: Calcula a franquia gratuita (3h) e horas adicionais por porte do armário.
 */
export function calcularTarifaPorTempoDeUso(
  checkIn: Date,
  checkOut: Date,
  tamanho: Tamanho
): ResultadoCalculoTarifa {
  const duracaoMs = Math.max(0, checkOut.getTime() - checkIn.getTime());
  const horasTotais = duracaoMs / (1000 * 60 * 60);

  if (horasTotais <= FRANQUIA_GRATUITA_HORAS) {
    return {
      horasTotais: Number(horasTotais.toFixed(2)),
      horasExcedentes: 0,
      valorCobrado: 0,
      statusPagamento: "ISENTO",
      pixTxId: null,
      pixCopiaECola: null,
    };
  }

  const horasExcedentes = Math.ceil(horasTotais - FRANQUIA_GRATUITA_HORAS);
  const valorHora = TARIFA_HORA_ADICIONAL_POR_TAMANHO[tamanho];
  const valorCobrado = Number((horasExcedentes * valorHora).toFixed(2));
  const pixTxId = `PIX-SL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const pixCopiaECola = `00020126580014BR.GOV.BCB.PIX0119smartlocker@pix.com520400005303986540${valorCobrado.toFixed(2)}5802BR5911SMARTLOCKER6009JOINVILLE62070503***6304ABCD`;

  return {
    horasTotais: Number(horasTotais.toFixed(2)),
    horasExcedentes,
    valorCobrado,
    statusPagamento: "PENDENTE",
    pixTxId,
    pixCopiaECola,
  };
}

/**
 * MNT-22: Processa notificações de webhook de pagamento PIX.
 */
export async function processarWebhookPagamentoPix(
  dados: {
    usoId?: string;
    pixTxId: string;
    status: "APROVADO" | "RECUSADO" | "EXPIRADO";
    valorPago?: number;
  },
  cliente: PrismaClient = prisma
) {
  const uso = await cliente.usoArmario.findFirst({
    where: dados.usoId
      ? { id: dados.usoId }
      : { pixTxId: dados.pixTxId },
    include: { armario: true },
  });

  if (!uso) {
    throw new ErroRegraDeNegocio(
      "COBRANCA_NAO_ENCONTRADA",
      "Registro de cobrança PIX não localizado",
      404
    );
  }

  const novoStatus = dados.status === "APROVADO" ? "PAGO" : "PENDENTE";

  return cliente.usoArmario.update({
    where: { id: uso.id },
    data: {
      statusPagamento: novoStatus,
      pixTxId: dados.pixTxId,
      ...(dados.valorPago !== undefined ? { valorCobrado: dados.valorPago } : {}),
    },
    include: { armario: true },
  });
}
