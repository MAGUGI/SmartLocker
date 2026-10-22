import { z } from "zod";

export const telemetriaInputSchema = z.object({
  armarioId: z.string().trim().min(1, "Informe o armário"),
  nivelBateria: z
    .number()
    .int()
    .min(0, "Bateria mínima é 0%")
    .max(100, "Bateria máxima é 100%"),
  temperatura: z
    .number()
    .min(-10, "Temperatura fora da faixa operacional")
    .max(85, "Temperatura fora da faixa operacional"),
  portaAberta: z.boolean(),
  tempoPortaAbertaSegundos: z.number().int().min(0).default(0),
});

export type TelemetriaInput = z.infer<typeof telemetriaInputSchema>;

export const criarUnidadeSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da unidade"),
  codigo: z
    .string()
    .trim()
    .min(2, "Informe o código da filial")
    .max(20, "Código deve ter até 20 caracteres"),
  endereco: z.string().trim().max(250).optional(),
});

export type CriarUnidadeInput = z.infer<typeof criarUnidadeSchema>;

export const webhookPagamentoPixSchema = z.object({
  usoId: z.string().trim().min(1).optional(),
  pixTxId: z.string().trim().min(3, "Informe o identificador da transação PIX"),
  status: z.enum(["APROVADO", "RECUSADO", "EXPIRADO"]),
  valorPago: z.number().min(0).optional(),
});

export type WebhookPagamentoPixInput = z.infer<typeof webhookPagamentoPixSchema>;
