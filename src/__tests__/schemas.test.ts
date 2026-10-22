import { describe, expect, it } from "vitest";

import {
  aberturaEmergenciaSchema,
  createArmarioSchema,
  forcarLiberacaoSchema,
  updateArmarioSchema,
  validarAcessoPinSchema,
} from "@/schemas/armario";
import {
  atualizarPerfilSchema,
  atualizarUsuarioAdminSchema,
  loginSchema,
  registerSchema,
} from "@/schemas/auth";
import { checkInSchema } from "@/schemas/checkin";
import {
  atualizarOrdemManutencaoSchema,
  criarInspecaoFisicaSchema,
  criarOrdemManutencaoSchema,
  criarRelatoProblemaSchema,
} from "@/schemas/manutencao";
import {
  criarUnidadeSchema,
  telemetriaInputSchema,
  webhookPagamentoPixSchema,
} from "@/schemas/operacoes";

describe("Schemas de validação Zod", () => {
  it("valida criação e atualização de armários", () => {
    expect(
      createArmarioSchema.safeParse({
        numero: 10,
        bloco: "Bloco A",
        tamanho: "M",
      }).success
    ).toBe(true);

    expect(
      createArmarioSchema.safeParse({
        numero: 0,
        bloco: "",
        tamanho: "M",
      }).success
    ).toBe(false);

    expect(
      updateArmarioSchema.safeParse({
        status: "MANUTENCAO",
        modalidadeManutencao: "MANUTENCAO_EMERGENCIAL",
      }).success
    ).toBe(true);
  });

  it("valida liberação forçada, abertura de emergência e PIN de 6 dígitos", () => {
    expect(
      forcarLiberacaoSchema.safeParse({
        justificativa: "Aluno esqueceu pertences e solicitou abertura presencial",
      }).success
    ).toBe(true);

    expect(forcarLiberacaoSchema.safeParse({ justificativa: "abc" }).success).toBe(
      false
    );

    expect(
      aberturaEmergenciaSchema.safeParse({
        motivo: "Solenoide travado com mochila dentro",
        pecasAfetadas: "Solenoide 12V",
      }).success
    ).toBe(true);

    expect(
      validarAcessoPinSchema.safeParse({
        armarioId: "arm-1",
        pin: "123456",
      }).success
    ).toBe(true);

    expect(
      validarAcessoPinSchema.safeParse({
        armarioId: "arm-1",
        pin: "12345a",
      }).success
    ).toBe(false);
  });

  it("valida autenticação, registro, perfil e gestão de usuários", () => {
    expect(
      loginSchema.safeParse({
        email: "aluno@smartlocker.com",
        senha: "123",
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        nome: "Maria Eduarda",
        email: "maria@smartlocker.com",
        matricula: "2026999",
        senha: "Senha123",
      }).success
    ).toBe(true);

    expect(
      atualizarPerfilSchema.safeParse({
        nome: "Novo Nome",
        senhaAtual: "SenhaAntiga1",
        novaSenha: "NovaSenha2",
      }).success
    ).toBe(true);

    expect(
      atualizarUsuarioAdminSchema.safeParse({
        userId: "usr-1",
        bloqueado: true,
      }).success
    ).toBe(true);

    expect(checkInSchema.safeParse({ armarioId: "arm-1" }).success).toBe(true);
  });

  it("valida relatos de avaria, ordens de manutenção e inspeções físicas", () => {
    expect(
      criarRelatoProblemaSchema.safeParse({
        armarioId: "arm-1",
        categoria: "TRAVA_EMPERRADA",
        descricao: "A porta não abre mesmo após check-out",
      }).success
    ).toBe(true);

    expect(
      criarOrdemManutencaoSchema.safeParse({
        armarioId: "arm-1",
        tipo: "CORRETIVA",
        descricao: "Troca do mecanismo da fechadura eletrônica",
        custo: 85.5,
      }).success
    ).toBe(true);

    expect(
      atualizarOrdemManutencaoSchema.safeParse({
        ordemId: "os-1",
        status: "CONCLUIDA",
        testadoAntesReativar: true,
        reativarArmario: true,
      }).success
    ).toBe(true);

    expect(
      criarInspecaoFisicaSchema.safeParse({
        bloco: "Bloco A",
        dataProgramada: "2026-11-01T10:00:00.000Z",
        alinhamentoOk: true,
        vedacaoOk: true,
        sensoresOk: false,
      }).success
    ).toBe(true);
  });

  it("valida telemetria IoT, unidades multi-tenant e webhook PIX", () => {
    expect(
      telemetriaInputSchema.safeParse({
        armarioId: "arm-1",
        nivelBateria: 22,
        temperatura: 26.4,
        portaAberta: true,
        tempoPortaAbertaSegundos: 340,
      }).success
    ).toBe(true);

    expect(
      criarUnidadeSchema.safeParse({
        nome: "Unidade Centro",
        codigo: "JVL-01",
      }).success
    ).toBe(true);

    expect(
      webhookPagamentoPixSchema.safeParse({
        pixTxId: "PIX-SL-12345",
        status: "APROVADO",
        valorPago: 16,
      }).success
    ).toBe(true);
  });
});
