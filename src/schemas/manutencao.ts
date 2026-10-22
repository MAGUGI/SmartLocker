import { z } from "zod";

export const categoriaProblemaSchema = z.enum([
  "TRAVA_EMPERRADA",
  "PORTA_DANIFICADA",
  "SUJEIRA",
  "OUTRO",
]);

export const criarRelatoProblemaSchema = z.object({
  armarioId: z.string().trim().min(1, "Informe o armário"),
  categoria: categoriaProblemaSchema,
  descricao: z
    .string()
    .trim()
    .min(5, "Descreva o problema com pelo menos 5 caracteres")
    .max(500, "A descrição deve ter no máximo 500 caracteres"),
});

export type CriarRelatoProblemaInput = z.infer<typeof criarRelatoProblemaSchema>;

export const tipoOrdemManutencaoSchema = z.enum([
  "CORRETIVA",
  "PREVENTIVA",
  "PREDITIVA",
  "MANUTENCAO_EMERGENCIAL",
  "HIGIENIZACAO",
]);

export const statusOrdemManutencaoSchema = z.enum([
  "ABERTA",
  "EM_ANDAMENTO",
  "AGUARDANDO_PECA",
  "CONCLUIDA",
]);

export const criarOrdemManutencaoSchema = z.object({
  armarioId: z.string().trim().min(1, "Informe o armário"),
  tipo: tipoOrdemManutencaoSchema,
  descricao: z
    .string()
    .trim()
    .min(5, "Informe a descrição do serviço")
    .max(500, "Descrição muito longa"),
  pecasTrocadas: z.string().trim().max(300).optional(),
  custo: z.number().min(0, "O custo não pode ser negativo").optional(),
});

export type CriarOrdemManutencaoInput = z.infer<typeof criarOrdemManutencaoSchema>;

export const atualizarOrdemManutencaoSchema = z.object({
  ordemId: z.string().trim().min(1, "Informe a ordem de serviço"),
  status: statusOrdemManutencaoSchema.optional(),
  pecasTrocadas: z.string().trim().max(300).optional(),
  custo: z.number().min(0, "O custo não pode ser negativo").optional(),
  testadoAntesReativar: z.boolean().optional(),
  reativarArmario: z.boolean().optional(),
});

export type AtualizarOrdemManutencaoInput = z.infer<
  typeof atualizarOrdemManutencaoSchema
>;

export const criarInspecaoFisicaSchema = z.object({
  bloco: z.string().trim().min(1, "Informe o bloco"),
  dataProgramada: z.string().min(1, "Informe a data programada"),
  alinhamentoOk: z.boolean().default(true),
  vedacaoOk: z.boolean().default(true),
  sensoresOk: z.boolean().default(true),
  observacoes: z.string().trim().max(400).optional(),
  concluida: z.boolean().default(false),
});

export type CriarInspecaoFisicaInput = z.infer<typeof criarInspecaoFisicaSchema>;

export const higienizarArmarioSchema = z.object({
  codigoQr: z.string().trim().optional(),
  observacoes: z.string().trim().max(300).optional(),
});

export type HigienizarArmarioInput = z.infer<typeof higienizarArmarioSchema>;
