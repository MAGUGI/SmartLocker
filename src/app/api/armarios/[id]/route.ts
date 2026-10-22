import { NextResponse } from "next/server";

import { comRotaAutenticada, ErroRegraDeNegocio } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { updateArmarioSchema } from "@/schemas/armario";
import { registrarAuditoria } from "@/server/auditoriaService";

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async (
    { user, ip, userAgent },
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const body = await request.json();
    const parsed = updateArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const armarioAtual = await prisma.armario.findUnique({
      where: { id: params.id },
    });
    if (!armarioAtual) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }

    const tentandoAlterarDadosOuManutencao =
      parsed.data.numero !== undefined ||
      parsed.data.bloco !== undefined ||
      parsed.data.tamanho !== undefined ||
      parsed.data.status === "MANUTENCAO";

    if (armarioAtual.status === "OCUPADO" && tentandoAlterarDadosOuManutencao) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_EM_USO",
        "Este armário está em uso. Utilize Abertura de Emergência ou Liberação Forçada.",
        409
      );
    }

    try {
      const armario = await prisma.armario.update({
        where: { id: params.id },
        data: parsed.data,
      });

      await registrarAuditoria({
        operadorId: user.id,
        acao: "ATUALIZAR_ARMARIO",
        entidade: "Armario",
        entidadeId: armario.id,
        detalhes: `Status: ${armario.status} | Bloco: ${armario.bloco}`,
        ip,
        userAgent,
      });

      return NextResponse.json(armario);
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2002: {
          status: 409,
          mensagem: "Já existe um armário com esse número neste bloco",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);

export const DELETE = comRotaAutenticada(
  "ADMIN",
  async (
    { user, ip, userAgent },
    _request: Request,
    { params }: { params: { id: string } }
  ) => {
    const armarioAtual = await prisma.armario.findUnique({
      where: { id: params.id },
    });
    if (!armarioAtual) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_NAO_ENCONTRADO",
        "Armário não encontrado",
        404
      );
    }
    if (armarioAtual.status === "OCUPADO") {
      throw new ErroRegraDeNegocio(
        "ARMARIO_EM_USO",
        "Este armário está em uso e não pode ser excluído agora",
        409
      );
    }

    try {
      await prisma.armario.delete({ where: { id: params.id } });

      await registrarAuditoria({
        operadorId: user.id,
        acao: "EXCLUIR_ARMARIO",
        entidade: "Armario",
        entidadeId: params.id,
        detalhes: `Armário #${armarioAtual.numero} (${armarioAtual.bloco}) excluído`,
        ip,
        userAgent,
      });

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2025: { status: 404, mensagem: "Armário não encontrado" },
        P2003: {
          status: 409,
          mensagem: "Armário possui histórico de uso e não pode ser excluído",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);
