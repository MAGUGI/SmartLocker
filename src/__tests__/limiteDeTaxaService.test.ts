import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  executarExpurgoERetencao,
  verificarLimiteDeTaxa,
} from "@/server/limiteDeTaxaService";

describe("limiteDeTaxaService e expurgo noturno (MNT-11)", () => {
  it("permite tentativas abaixo do limite e bloqueia quando atinge o limite", async () => {
    const mockPrisma = {
      tentativaAcesso: {
        count: vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(5),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({ id: "t-1" }),
      },
      usoArmario: {
        updateMany: vi.fn().mockResolvedValue({ count: 4 }),
      },
    } as unknown as PrismaClient;

    const permitido = await verificarLimiteDeTaxa("login:127.0.0.1", 5, 60, mockPrisma);
    expect(permitido).toBe(true);

    const bloqueado = await verificarLimiteDeTaxa("login:127.0.0.1", 5, 60, mockPrisma);
    expect(bloqueado).toBe(false);
  });

  it("executa expurgo de tentativas antigas (>2 dias) e arquivamento de histórico (>90 dias)", async () => {
    const mockPrisma = {
      tentativaAcesso: {
        deleteMany: vi.fn().mockResolvedValue({ count: 12 }),
      },
      usoArmario: {
        updateMany: vi.fn().mockResolvedValue({ count: 7 }),
      },
    } as unknown as PrismaClient;

    const resultado = await executarExpurgoERetencao(mockPrisma, 2, 90);
    expect(resultado.tentativasRemovidas).toBe(12);
    expect(resultado.usosArquivados).toBe(7);
  });
});
