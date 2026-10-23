"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidarConsultasDeUso } from "@/hooks/invalidarConsultasDeUso";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  AberturaEmergenciaInput,
  CreateArmarioInput,
  ForcarLiberacaoInput,
  UpdateArmarioInput,
} from "@/schemas/armario";
import type { HigienizarArmarioInput } from "@/schemas/manutencao";
import {
  createArmario,
  deleteArmario,
  executarAberturaEmergenciaApi,
  forcarLiberacaoArmarioApi,
  higienizarArmarioApi,
  updateArmario,
} from "@/services/armario.service";

export function useCreateArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateArmarioInput) => createArmario(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
    },
  });
}

export function useUpdateArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      armarioId,
      dadosAtualizacao,
    }: {
      armarioId: string;
      dadosAtualizacao: UpdateArmarioInput;
    }) => updateArmario(armarioId, dadosAtualizacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
    },
  });
}

export function useDeleteArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (armarioId: string) => deleteArmario(armarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
    },
  });
}

export function useForcarLiberacaoArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      armarioId,
      dados,
    }: {
      armarioId: string;
      dados: ForcarLiberacaoInput;
    }) => forcarLiberacaoArmarioApi(armarioId, dados),
    onSuccess: () => {
      invalidarConsultasDeUso(queryClient);
    },
  });
}

export function useAberturaEmergenciaArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      armarioId,
      dados,
    }: {
      armarioId: string;
      dados: AberturaEmergenciaInput;
    }) => executarAberturaEmergenciaApi(armarioId, dados),
    onSuccess: () => {
      invalidarConsultasDeUso(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.ordensManutencao });
    },
  });
}

export function useHigienizarArmario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      armarioId,
      dados,
    }: {
      armarioId: string;
      dados?: HigienizarArmarioInput;
    }) => higienizarArmarioApi(armarioId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.armarios });
      queryClient.invalidateQueries({ queryKey: queryKeys.ordensManutencao });
    },
  });
}
