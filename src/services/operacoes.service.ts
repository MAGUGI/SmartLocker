import { apiFetch } from "@/lib/apiClient";
import type {
  AtualizarPerfilInput,
  AtualizarUsuarioAdminInput,
} from "@/schemas/auth";
import type {
  AtualizarOrdemManutencaoInput,
  CriarInspecaoFisicaInput,
  CriarOrdemManutencaoInput,
  CriarRelatoProblemaInput,
} from "@/schemas/manutencao";
import type { CriarUnidadeInput, TelemetriaInput } from "@/schemas/operacoes";
import type {
  ArmarioTelemetria,
  AuditoriaLog,
  DiagnosticoSaude,
  InspecaoFisica,
  OrdemManutencao,
  RelatoProblemaArmario,
  Unidade,
  UsoArmarioResumo,
  UsuarioResumo,
  UsuariosPaginados,
} from "@/types/armario";
import { construirQueryString } from "@/utils/construirQueryString";

export function listarRelatosProblemaApi(pendentes = false) {
  const query = pendentes ? "?pendentes=true" : "";
  return apiFetch<RelatoProblemaArmario[]>(`/api/relatos-problema${query}`);
}

export function criarRelatoProblemaApi(input: CriarRelatoProblemaInput) {
  return apiFetch<RelatoProblemaArmario>("/api/relatos-problema", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listarOrdensManutencaoApi() {
  return apiFetch<OrdemManutencao[]>("/api/ordens-manutencao");
}

export function criarOrdemManutencaoApi(input: CriarOrdemManutencaoInput) {
  return apiFetch<OrdemManutencao>("/api/ordens-manutencao", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function atualizarOrdemManutencaoApi(
  input: AtualizarOrdemManutencaoInput
) {
  return apiFetch<OrdemManutencao>("/api/ordens-manutencao", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listarInspecoesApi() {
  return apiFetch<InspecaoFisica[]>("/api/inspecoes");
}

export function criarInspecaoApi(input: CriarInspecaoFisicaInput) {
  return apiFetch<InspecaoFisica>("/api/inspecoes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listarTelemetriaApi() {
  return apiFetch<ArmarioTelemetria[]>("/api/iot/telemetria");
}

export function registrarTelemetriaApi(input: TelemetriaInput) {
  return apiFetch<{
    telemetria: ArmarioTelemetria;
    avaliacao: { alertas: string[] };
  }>("/api/iot/telemetria", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function obterPerfilApi() {
  return apiFetch<{
    id: string;
    nome: string;
    email: string;
    role: "ALUNO" | "ADMIN";
    matricula: string | null;
    unidadeId: string | null;
    createdAt: string;
    usos: UsoArmarioResumo[];
  }>("/api/perfil");
}

export function atualizarPerfilApi(input: AtualizarPerfilInput) {
  return apiFetch<UsuarioResumo>("/api/perfil", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function exportarDadosLgpdApi() {
  return apiFetch<Record<string, unknown>>("/api/lgpd/exportar");
}

export function anonimizarContaLgpdApi() {
  return apiFetch<{ id: string; anonimizado: boolean; mensagem: string }>(
    "/api/lgpd/conta",
    { method: "DELETE" }
  );
}

export function listarUsuariosAdminApi(
  filtros: { busca?: string; pagina?: number; unidadeId?: string } = {}
) {
  const query = construirQueryString({
    busca: filtros.busca,
    unidadeId: filtros.unidadeId,
    pagina: filtros.pagina !== undefined ? String(filtros.pagina) : undefined,
  });
  return apiFetch<UsuariosPaginados>(`/api/usuarios${query}`);
}

export function atualizarUsuarioAdminApi(input: AtualizarUsuarioAdminInput) {
  return apiFetch<UsuarioResumo>("/api/usuarios", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listarAuditoriaApi(
  filtros: { entidade?: string; pagina?: number } = {}
) {
  const query = construirQueryString({
    entidade: filtros.entidade,
    pagina: filtros.pagina !== undefined ? String(filtros.pagina) : undefined,
  });
  return apiFetch<{
    dados: AuditoriaLog[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }>(`/api/auditoria${query}`);
}

export function listarUnidadesApi() {
  return apiFetch<Unidade[]>("/api/unidades");
}

export function criarUnidadeApi(input: CriarUnidadeInput) {
  return apiFetch<Unidade>("/api/unidades", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function obterDiagnosticoSaudeApi() {
  return apiFetch<DiagnosticoSaude>("/api/health");
}

export function dispararVerificacaoAbandonoApi() {
  return apiFetch<{
    quantidadeRetidos: number;
    verificadoEm: string;
  }>("/api/cron/verificar-armarios-abandonados", { method: "POST" });
}

export function dispararExpurgoRegistrosApi() {
  return apiFetch<{
    tentativasRemovidas: number;
    usosArquivados: number;
    executadoEm: string;
  }>("/api/cron/expurgar-registros", { method: "POST" });
}
