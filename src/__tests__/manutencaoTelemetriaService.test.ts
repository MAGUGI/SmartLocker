import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  atualizarOrdemManutencao,
  avaliarDesgasteSolenoide,
  concluirHigienizacaoArmario,
  criarInspecaoFisica,
  criarOrdemManutencao,
  criarRelatoProblema,
} from "@/server/manutencaoService";
import {
  avaliarLeituraTelemetria,
  registrarTelemetriaArmario,
  verificarConexaoMqttAdapter,
} from "@/server/telemetriaService";

describe("manutencaoService e telemetriaService (MNT-04, 05, 07, 08, 09, 10, 12, 17)", () => {
  it("avalia desgaste mecânico de solenoide por ciclos de abertura (MNT-07)", () => {
    expect(avaliarDesgasteSolenoide(250).nivelAlerta).toBe("NORMAL");
    expect(avaliarDesgasteSolenoide(1200).nivelAlerta).toBe("PREVENTIVA");
    expect(avaliarDesgasteSolenoide(5100).nivelAlerta).toBe("CRITICO");
  });

  it("avalia telemetria IoT para bateria baixa, bateria crítica e porta aberta >5 min (MNT-08 / MNT-17)", () => {
    const leituraCritica = avaliarLeituraTelemetria({
      nivelBateria: 8,
      temperatura: 25,
      portaAberta: true,
      tempoPortaAbertaSegundos: 350,
    });
    expect(leituraCritica.bloqueioBateriaCritica).toBe(true);
    expect(leituraCritica.alertaPortaAbertaProlongada).toBe(true);
    expect(leituraCritica.alertas).toHaveLength(2);

    const leituraPreventiva = avaliarLeituraTelemetria({
      nivelBateria: 20,
      temperatura: 24,
      portaAberta: false,
      tempoPortaAbertaSegundos: 0,
    });
    expect(leituraPreventiva.alertaBateriaPreventivo).toBe(true);
    expect(leituraPreventiva.bloqueioBateriaCritica).toBe(false);

    expect(verificarConexaoMqttAdapter().conectado).toBe(true);
  });

  it("registra telemetria e bloqueia armário automaticamente quando bateria <= 10%", async () => {
    const tx = {
      armario: {
        findUnique: vi.fn().mockResolvedValue({
          id: "arm-1",
          status: "LIVRE",
          portaAbertaDesde: null,
        }),
        update: vi.fn().mockResolvedValue({ id: "arm-1", status: "MANUTENCAO" }),
      },
      armarioTelemetria: {
        create: vi.fn().mockResolvedValue({ id: "tel-1" }),
      },
      ordemManutencao: {
        create: vi.fn().mockResolvedValue({ id: "os-pred-1" }),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (cb: (c: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaClient;

    const res = await registrarTelemetriaArmario(
      {
        armarioId: "arm-1",
        nivelBateria: 9,
        temperatura: 27,
        portaAberta: false,
        tempoPortaAbertaSegundos: 0,
      },
      prisma
    );

    expect(res.avaliacao.bloqueioBateriaCritica).toBe(true);
    expect(tx.ordemManutencao.create).toHaveBeenCalledOnce();
  });

  it("cria relato, gerencia OS exigindo teste antes de reativar, higieniza e cria inspeção", async () => {
    const tx = {
      armario: {
        findUnique: vi.fn().mockResolvedValue({
          id: "arm-1",
          numero: 1,
          bloco: "Bloco A",
          status: "MANUTENCAO",
          modalidadeManutencao: "HIGIENIZACAO",
        }),
        update: vi.fn().mockResolvedValue({ id: "arm-1", status: "LIVRE" }),
      },
      relatoProblemaArmario: {
        create: vi.fn().mockResolvedValue({ id: "rel-1", prioridadeAlta: true }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      ordemManutencao: {
        findUnique: vi.fn().mockResolvedValue({
          id: "os-1",
          armarioId: "arm-1",
          status: "EM_ANDAMENTO",
          testadoAntesReativar: false,
          pecasTrocadas: null,
          custo: 0,
          concluidaEm: null,
        }),
        create: vi.fn().mockResolvedValue({ id: "os-1" }),
        update: vi.fn().mockResolvedValue({ id: "os-1", status: "CONCLUIDA" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      inspecaoFisica: {
        create: vi.fn().mockResolvedValue({ id: "insp-1" }),
      },
      auditoriaLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      ...tx,
      $transaction: vi.fn(async (cb: (c: typeof tx) => unknown) => cb(tx)),
    } as unknown as PrismaClient;

    const relato = await criarRelatoProblema(
      "user-1",
      {
        armarioId: "arm-1",
        categoria: "TRAVA_EMPERRADA",
        descricao: "Trava não responde ao comando",
      },
      prisma
    );
    expect(relato.id).toBe("rel-1");

    const os = await criarOrdemManutencao(
      {
        armarioId: "arm-1",
        tipo: "CORRETIVA",
        descricao: "Substituição de solenoide",
      },
      prisma,
      "admin-1"
    );
    expect(os.id).toBe("os-1");

    await expect(
      atualizarOrdemManutencao(
        {
          ordemId: "os-1",
          reativarArmario: true,
          testadoAntesReativar: false,
        },
        prisma
      )
    ).rejects.toMatchObject({
      codigo: "TESTE_OBRIGATORIO_PARA_REATIVAR",
      status: 422,
    });

    const osConcluida = await atualizarOrdemManutencao(
      {
        ordemId: "os-1",
        reativarArmario: true,
        testadoAntesReativar: true,
      },
      prisma,
      "admin-1"
    );
    expect(osConcluida.status).toBe("CONCLUIDA");

    const higienizado = await concluirHigienizacaoArmario(
      "arm-1",
      "Limpeza com álcool 70%",
      prisma,
      "admin-1"
    );
    expect(higienizado.status).toBe("LIVRE");

    const inspecao = await criarInspecaoFisica(
      {
        bloco: "Bloco A",
        dataProgramada: "2026-11-10T10:00:00.000Z",
        alinhamentoOk: true,
        vedacaoOk: true,
        sensoresOk: true,
        concluida: true,
      },
      prisma
    );
    expect(inspecao.id).toBe("insp-1");
  });
});
