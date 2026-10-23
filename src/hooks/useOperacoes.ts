"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queryKeys";
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
import type { CriarUnidadeInput } from "@/schemas/operacoes";
import {
  atualizarOrdemManutencaoApi,
  atualizarPerfilApi,
  atualizarUsuarioAdminApi,
  criarInspecaoApi,
  criarOrdemManutencaoApi,
  criarRelatoProblemaApi,
  criarUnidadeApi,
  listarAuditoriaApi,
  listarInspecoesApi,
  listarOrdensManutencaoApi,
  listarRelatosProblemaApi,
  listarTelemetriaApi,
  listarUnidadesApi,
  listarUsuariosAdminApi,
  obterDiagnosticoSaudeApi,
  obterPerfilApi,
} from "@/services/operacoes.service";

export function useRelatosProblema(pendentes = false) {
  return useQuery({
    queryKey: [...queryKeys.relatosProblema, pendentes],
    queryFn: () => listarRelatosProblemaApi(pendentes),
  });
}

export function useCriarRelatoProblema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarRelatoProblemaInput) =>
      criarRelatoProblemaApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relatosProblema });
    },
  });
}

export function useOrdensManutencao() {
  return useQuery({
    queryKey: queryKeys.ordensManutencao,
    queryFn: listarOrdensManutencaoApi,
  });
}

export function useCriarOrdemManutencao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarOrdemManutencaoInput) =>
      criarOrdemManutencaoApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ordensManutencao });
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
    },
  });
}

export function useAtualizarOrdemManutencao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: AtualizarOrdemManutencaoInput) =>
      atualizarOrdemManutencaoApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ordensManutencao });
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
      queryClient.invalidateQueries({ queryKey: queryKeys.relatosProblema });
    },
  });
}

export function useInspecoes() {
  return useQuery({
    queryKey: queryKeys.inspecoes,
    queryFn: listarInspecoesApi,
  });
}

export function useCriarInspecao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarInspecaoFisicaInput) => criarInspecaoApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inspecoes });
    },
  });
}

export function useTelemetria() {
  return useQuery({
    queryKey: queryKeys.telemetria,
    queryFn: listarTelemetriaApi,
  });
}

export function usePerfil() {
  return useQuery({
    queryKey: queryKeys.perfil,
    queryFn: obterPerfilApi,
  });
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: AtualizarPerfilInput) => atualizarPerfilApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil });
    },
  });
}

export function useUsuariosAdmin(filtros: {
  busca?: string;
  pagina?: number;
  unidadeId?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.usuarios, filtros],
    queryFn: () => listarUsuariosAdminApi(filtros),
  });
}

export function useAtualizarUsuarioAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: AtualizarUsuarioAdminInput) =>
      atualizarUsuarioAdminApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios });
      queryClient.invalidateQueries({ queryKey: queryKeys.auditoria });
    },
  });
}

export function useAuditoria(filtros: { entidade?: string; pagina?: number }) {
  return useQuery({
    queryKey: [...queryKeys.auditoria, filtros],
    queryFn: () => listarAuditoriaApi(filtros),
  });
}

export function useUnidades() {
  return useQuery({
    queryKey: queryKeys.unidades,
    queryFn: listarUnidadesApi,
  });
}

export function useCriarUnidade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: CriarUnidadeInput) => criarUnidadeApi(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unidades });
    },
  });
}

export function useDiagnosticoSaude() {
  return useQuery({
    queryKey: queryKeys.saude,
    queryFn: obterDiagnosticoSaudeApi,
  });
}
