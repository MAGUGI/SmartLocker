import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  executarAberturaEmergencia,
  forcarLiberacaoArmario,
  gerarPinTemporario,
  realizarCheckIn,
  realizarCheckOut,
  requerHigienizacaoPeriodica,
  validarAcessoHardwarePin,
  verificarArmariosAbandonados,
} from "@/server/usoService";

function criarMockPrismaTransacional(overrides: Record<string, unknown> = {}) {
  const tx = {
    usoArmario: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    armario: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    ordemManutencao: {
      create: vi.fn(),
    },
    auditoriaLog: {
      create: vi.fn(),
    },
    ...overrides,
  };

  const prisma = {
    ...tx,
    $transaction: vi.fn(async (callback: (clienteTx: typeof tx) => unknown) =>
      callback(tx)
    ),
  } as unknown as PrismaClient;

  return { prisma, tx };
}

describe("usoService (Check-in, Check-out, Emergência, Liberação Forçada, PIN e Abandono)", () => {
  it("gera PIN numérico de 6 dígitos e avalia regra de higienização periódica", () => {
    const pin = gerarPinTemporario();
    expect(pin).toMatch(/^\d{6}$/);

    const agora = new Date("2026-10-22T12:00:00.000Z");
    expect(requerHigienizacaoPeriodica(30, agora, agora)).toBe(true);
    expect(
      requerHigienizacaoPeriodica(
        5,
        new Date("2026-10-10T12:00:00.000Z"),
        agora
      )
    ).toBe(true);
    expect(requerHigienizacaoPeriodica(10, agora, agora)).toBe(false);
  });

  it("realiza check-in com incremento de ciclos e geração de PIN temporário", async () => {
    const { prisma, tx } = criarMockPrismaTransacional();
    tx.usoArmario.findFirst.mockResolvedValue(null);
    tx.armario.updateMany.mockResolvedValue({ count: 1 });
    tx.usoArmario.create.mockImplementation(async ({ data }) => ({
      id: "uso-1",
      ...data,
      armario: { id: data.armarioId, numero: 1, bloco: "Bloco A", tamanho: "M" },
    }));

    const resultado = await realizarCheckIn(prisma, "user-1", "arm-1");
    expect(resultado.pinAcesso).toMatch(/^\d{6}$/);
    expect(tx.armario.updateMany).toHaveBeenCalledWith({
      where: { id: "arm-1", status: "LIVRE" },
      data: {
        status: "OCUPADO",
        totalCiclosAbertura: { increment: 1 },
        usosDesdeHigienizacao: { increment: 1 },
      },
    });
  });

  it("impede check-in duplicado ou em armário indisponível", async () => {
    const { prisma, tx } = criarMockPrismaTransacional();
    tx.usoArmario.findFirst.mockResolvedValue({ id: "uso-ativo" });

    await expect(realizarCheckIn(prisma, "user-1", "arm-1")).rejects.toMatchObject({
      codigo: "ALUNO_JA_POSSUI_ARMARIO",
      status: 409,
    });

    tx.usoArmario.findFirst.mockResolvedValue(null);
    tx.armario.updateMany.mockResolvedValue({ count: 0 });

    await expect(realizarCheckIn(prisma, "user-1", "arm-1")).rejects.toMatchObject({
      codigo: "ARMARIO_INDISPONIVEL",
      status: 409,
    });
  });

  it("realiza check-out agendando higienização quando atinge 30 usos", async () => {
    const { prisma, tx } = criarMockPrismaTransacional();
    tx.usoArmario.findFirst.mockResolvedValue({
      id: "uso-1",
      userId: "user-1",
      armarioId: "arm-1",
      checkIn: new Date(Date.now() - 60 * 60 * 1000),
      armario: {
        id: "arm-1",
        tamanho: "M",
        usosDesdeHigienizacao: 30,
        ultimaHigienizacaoEm: new Date(),
      },
    });
    tx.armario.update.mockResolvedValue({});
    tx.ordemManutencao.create.mockResolvedValue({ id: "os-hig-1" });
    tx.usoArmario.update.mockImplementation(async ({ data }) => ({
      id: "uso-1",
      ...data,
    }));

    const resultado = await realizarCheckOut(prisma, "user-1");
    expect(resultado.statusPagamento).toBe("ISENTO");
    expect(tx.armario.update).toHaveBeenCalledWith({
      where: { id: "arm-1" },
      data: { status: "MANUTENCAO", modalidadeManutencao: "HIGIENIZACAO" },
    });
    expect(tx.ordemManutencao.create).toHaveBeenCalledOnce();
  });

  it("executa liberação forçada (MNT-02) e abertura de emergência (MNT-01)", async () => {
    const { prisma, tx } = criarMockPrismaTransacional();
    tx.armario.findUnique.mockResolvedValue({ id: "arm-1", numero: 1, bloco: "A" });
    tx.usoArmario.findFirst.mockResolvedValue({ id: "uso-1", armarioId: "arm-1" });
    tx.usoArmario.update.mockResolvedValue({});
    tx.armario.update.mockResolvedValue({ id: "arm-1", status: "LIVRE" });
    tx.ordemManutencao.create.mockResolvedValue({ id: "os-emg-1" });
    tx.auditoriaLog.create.mockResolvedValue({});

    const liberado = await forcarLiberacaoArmario(
      prisma,
      "arm-1",
      "Chave perdida pelo usuário",
      { operadorId: "admin-1" }
    );
    expect(liberado.usoEncerradoId).toBe("uso-1");

    const emergencia = await executarAberturaEmergencia(
      prisma,
      "arm-1",
      "Trava emperrada com mochila",
      "Solenoide",
      { operadorId: "admin-1" }
    );
    expect(emergencia.ordemServico.id).toBe("os-emg-1");
  });

  it("marca armários abandonados (>3h) e valida PIN de hardware", async () => {
    const { prisma, tx } = criarMockPrismaTransacional();
    tx.usoArmario.findMany.mockResolvedValue([
      {
        id: "uso-retido",
        armarioId: "arm-2",
        checkIn: new Date(Date.now() - 4 * 60 * 60 * 1000),
        armario: { numero: 2, bloco: "Bloco B" },
        user: { id: "u-1", nome: "Bruno", matricula: "2026002" },
      },
    ]);
    tx.usoArmario.updateMany.mockResolvedValue({ count: 1 });

    const abandono = await verificarArmariosAbandonados(prisma);
    expect(abandono.quantidadeRetidos).toBe(1);

    tx.usoArmario.findFirst.mockResolvedValue({
      id: "uso-pin",
      armarioId: "arm-2",
      pinAcesso: "654321",
      pinExpiraEm: new Date(Date.now() + 60_000),
    });
    tx.armario.update.mockResolvedValue({
      id: "arm-2",
      numero: 2,
      bloco: "Bloco B",
      totalCiclosAbertura: 15,
    });

    const validacao = await validarAcessoHardwarePin(prisma, "arm-2", "654321");
    expect(validacao.autorizado).toBe(true);
    expect(validacao.comandoHardware).toBe("DESTRAVAR_SOLENOIDE");
  });
});
