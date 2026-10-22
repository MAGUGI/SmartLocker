import { z } from "zod";

export const tamanhoSchema = z.enum(["P", "M", "G"]);
export const statusArmarioSchema = z.enum(["LIVRE", "OCUPADO", "MANUTENCAO"]);
export const modalidadeManutencaoSchema = z.enum([
  "PADRAO",
  "MANUTENCAO_EMERGENCIAL",
  "HIGIENIZACAO",
  "PREDITIVA_BATERIA",
]);

const numeroSchema = z
  .number("Informe o número do armário")
  .int("O número deve ser um número inteiro")
  .positive("O número deve ser maior que zero");

export const createArmarioSchema = z.object({
  numero: numeroSchema,
  bloco: z.string().trim().min(1, "Informe o bloco"),
  tamanho: tamanhoSchema,
  unidadeId: z.string().trim().min(1).optional(),
});

export type CreateArmarioInput = z.infer<typeof createArmarioSchema>;

export const updateArmarioSchema = z.object({
  numero: numeroSchema.optional(),
  bloco: z.string().trim().min(1, "Informe o bloco").optional(),
  tamanho: tamanhoSchema.optional(),
  status: statusArmarioSchema.optional(),
  modalidadeManutencao: modalidadeManutencaoSchema.nullable().optional(),
  unidadeId: z.string().trim().min(1).nullable().optional(),
});

export type UpdateArmarioInput = z.infer<typeof updateArmarioSchema>;

export const forcarLiberacaoSchema = z.object({
  justificativa: z
    .string()
    .trim()
    .min(5, "A justificativa deve conter pelo menos 5 caracteres")
    .max(300, "A justificativa deve conter no máximo 300 caracteres"),
});

export type ForcarLiberacaoInput = z.infer<typeof forcarLiberacaoSchema>;

export const aberturaEmergenciaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Descreva o motivo da abertura de emergência")
    .max(300, "O motivo deve conter no máximo 300 caracteres"),
  pecasAfetadas: z.string().trim().max(200).optional(),
});

export type AberturaEmergenciaInput = z.infer<typeof aberturaEmergenciaSchema>;

export const validarAcessoPinSchema = z.object({
  armarioId: z.string().trim().min(1, "Informe o armário"),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "O PIN de acesso deve conter exatamente 6 dígitos numéricos"),
});

export type ValidarAcessoPinInput = z.infer<typeof validarAcessoPinSchema>;
