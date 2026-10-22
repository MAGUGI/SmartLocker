import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { listarAuditoria, registrarAuditoria } from "@/server/auditoriaService";
import {
  anonimizarContaLgpd,
  exportarDadosPessoaisLgpd,
} from "@/server/lgpdService";
import {
  calcularTarifaPorTempoDeUso,
  processarWebhookPagamentoPix,
} from "@/server/tarifacaoService";

describe("tarifacaoService, lgpdService e auditoriaService (MNT-18, 19, 22)", () => {
  it("calcula isenção até 3h e tarifa excedente com código PIX após 3h (MNT-22)", () => {
    const inicio = new Date("2026-10-22T10:00:00.000Z");
    const fimIsento = new Date("2026-10-22T12:30:00.000Z");
    const fimExcedido = new Date("2026-10-22T15:10:00.000Z"); // 5.16h => 3h excedentes

    const isento = calcularTarifaPorTempoDeUso(inicio, fimIsento, "P");
    expect(isento.valorCobrado).toBe(0);
    expect(isento.statusPagamento).toBe("ISENTO");

    const tarifado = calcularTarifaPorTempoDeUso(inicio, fimExcedido, "G");
    expect(tarifado.horasExcedentes).toBe(3);
    expect(tarifado.valorCobrado).toBe(36); // 3h * R$ 12 (G)
    expect(tarifado.statusPagamento).toBe("PENDENTE");
    expect(tarifado.pixTxId).toMatch(/^PIX-SL-/);
  });

  it("processa webhook de liquidação PIX (MNT-22)", async () => {
    const mockPrisma = {
      usoArmario: {
        findFirst: vi.fn().mockResolvedValue({ id: "uso-1", pixTxId: "PIX-1" }),
        update: vi.fn().mockResolvedValue({
          id: "uso-1",
          statusPagamento: "PAGO",
          valorCobrado: 16,
        }),
      },
    } as unknown as PrismaClient;

    const resultado = await processarWebhookPagamentoPix(
      { pixTxId: "PIX-1", status: "APROVADO", valorPago: 16 },
      mockPrisma
    );
    expect(resultado.statusPagamento).toBe("PAGO");
  });

  it("exporta dados pessoais em JSON e anonimiza conta LGPD (MNT-19)", async () => {
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "u-1",
          nome: "Ana Souza",
          email: "ana@smartlocker.com",
          matricula: "2026001",
          role: "ALUNO",
          createdAt: new Date(),
          unidade: { id: "uni-1", nome: "Centro", codigo: "JVL-1" },
          usos: [],
          relatos: [],
        }),
        update: vi.fn().mockResolvedValue({ id: "u-1", anonimizado: true }),
      },
      usoArmario: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      auditoriaLog: {
        create: vi.fn().mockResolvedValue({ id: "aud-1" }),
        findMany: vi.fn().mockResolvedValue([{ id: "aud-1", acao: "LOGIN" }]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const mockPrisma = {
      ...tx,
      $transaction: vi.fn(async (cb: (c: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaClient;

    const exportado = await exportarDadosPessoaisLgpd("u-1", mockPrisma);
    expect(exportado.titular.email).toBe("ana@smartlocker.com");

    const anonimizado = await anonimizarContaLgpd("u-1", mockPrisma);
    expect(anonimizado.anonimizado).toBe(true);

    await registrarAuditoria(
      { acao: "TESTE", entidade: "Sistema" },
      mockPrisma
    );
    const logs = await listarAuditoria(mockPrisma, { pagina: 1, tamanhoPagina: 10 });
    expect(logs.total).toBe(1);
  });
});
