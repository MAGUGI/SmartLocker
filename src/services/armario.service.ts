import { apiFetch } from "@/lib/apiClient";
import type {
  AberturaEmergenciaInput,
  CreateArmarioInput,
  ForcarLiberacaoInput,
  UpdateArmarioInput,
  ValidarAcessoPinInput,
} from "@/schemas/armario";
import type { HigienizarArmarioInput } from "@/schemas/manutencao";
import type { Armario, ArmarioFiltros, OrdemManutencao } from "@/types/armario";
import { construirQueryString } from "@/utils/construirQueryString";

export function listArmarios(filtros: ArmarioFiltros = {}) {
  const query = construirQueryString({
    bloco: filtros.bloco,
    tamanho: filtros.tamanho,
    status: filtros.status,
    unidadeId: filtros.unidadeId,
  });
  return apiFetch<Armario[]>(`/api/armarios${query}`);
}

export function createArmario(input: CreateArmarioInput) {
  return apiFetch<Armario>("/api/armarios", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateArmario(id: string, input: UpdateArmarioInput) {
  return apiFetch<Armario>(`/api/armarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteArmario(id: string) {
  return apiFetch<void>(`/api/armarios/${id}`, { method: "DELETE" });
}

export function forcarLiberacaoArmarioApi(
  id: string,
  input: ForcarLiberacaoInput
) {
  return apiFetch<{ armario: Armario; usoEncerradoId: string | null }>(
    `/api/armarios/${id}/forcar-liberacao`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export function executarAberturaEmergenciaApi(
  id: string,
  input: AberturaEmergenciaInput
) {
  return apiFetch<{
    armario: Armario;
    ordemServico: OrdemManutencao;
    usoDesocupadoId: string | null;
  }>(`/api/armarios/${id}/abertura-emergencia`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function higienizarArmarioApi(
  id: string,
  input: HigienizarArmarioInput = {}
) {
  return apiFetch<Armario>(`/api/armarios/${id}/higienizar`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function validarAcessoHardwarePinApi(input: ValidarAcessoPinInput) {
  return apiFetch<{
    autorizado: boolean;
    comandoHardware: string;
    armarioId: string;
    numero: number;
    bloco: string;
    totalCiclosAbertura: number;
  }>("/api/armarios/validar-acesso", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
