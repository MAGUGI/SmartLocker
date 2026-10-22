import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  ApiAuthError,
  ErroRegraDeNegocio,
  handleApiError,
} from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { checkInSchema } from "@/schemas/checkin";

describe("Helpers de rota de API e mapeamento de erros (MNT-06)", () => {
  it("formata respostas HTTP de ApiAuthError, ErroRegraDeNegocio e erro 500", async () => {
    const res401 = handleApiError(new ApiAuthError(401, "Não autenticado"));
    expect(res401.status).toBe(401);

    const res409 = handleApiError(
      new ErroRegraDeNegocio("CONFLITO", "Armário ocupado", 409)
    );
    expect(res409.status).toBe(409);

    const res500 = handleApiError(new Error("Falha inesperada"));
    expect(res500.status).toBe(500);
  });

  it("mapeia erros conhecidos do Prisma (P2002 / P2025) e responde 400 para Zod", async () => {
    const erroDuplicado = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "6.0.0" }
    );

    const resposta = mapearErroPrisma(erroDuplicado, {
      P2002: { status: 409, mensagem: "Registro duplicado" },
    });
    expect(resposta?.status).toBe(409);
    expect(mapearErroPrisma(new Error("Outro"), {})).toBeNull();

    const validacao = checkInSchema.safeParse({ armarioId: "" });
    if (!validacao.success) {
      const res400 = validarOuResponder400(validacao.error);
      expect(res400.status).toBe(400);
    }
  });
});
