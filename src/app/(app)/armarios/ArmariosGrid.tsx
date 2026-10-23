"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ArmarioCard } from "@/components/ArmarioCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArmarios } from "@/hooks/useArmarios";
import { useCheckIn } from "@/hooks/useCheckIn";
import { useMeuUso } from "@/hooks/useMeuUso";
import { useUnidades } from "@/hooks/useOperacoes";
import { ApiClientError } from "@/lib/apiClient";
import type { ArmarioFiltros, Tamanho } from "@/types/armario";

const TODOS = "todos";

export function ArmariosGrid() {
  const [filtros, setFiltros] = useState<ArmarioFiltros>({});

  const { data: unidades } = useUnidades();
  const { data: todosArmarios } = useArmarios();
  const { data: armarios, isLoading } = useArmarios(filtros);
  const { data: meuUso } = useMeuUso();
  const checkInMutation = useCheckIn();

  const blocos = Array.from(
    new Set((todosArmarios ?? []).map((armario) => armario.bloco))
  ).sort();

  const jaTemArmario = Boolean(meuUso);

  function handleCheckIn(armarioId: string) {
    checkInMutation.mutate(armarioId, {
      onSuccess: () => {
        toast.success("Check-in realizado! Aproveite o treino.");
      },
      onError: (error) => {
        const mensagem =
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível fazer o check-in";
        toast.error(mensagem);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Armários</h1>
        <p className="text-sm text-muted-foreground">
          Escolha um armário livre para guardar seus pertences durante o
          treino.
        </p>
      </div>

      {jaTemArmario && (
        <div className="rounded-md border border-status-ocupado/30 bg-status-ocupado/5 px-4 py-3 text-sm text-status-ocupado">
          Você já está com um armário em uso. Faça o check-out em{" "}
          <span className="font-medium">Meu armário</span> antes de pegar
          outro.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {unidades && unidades.length > 0 && (
          <Select
            value={filtros.unidadeId ?? TODOS}
            onValueChange={(value) =>
              setFiltros((prev) => ({
                ...prev,
                unidadeId: value === TODOS ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Unidade / Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as unidades</SelectItem>
              {unidades.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome} ({u.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filtros.bloco ?? TODOS}
          onValueChange={(value) =>
            setFiltros((prev) => ({
              ...prev,
              bloco: value === TODOS ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Bloco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os blocos</SelectItem>
            {blocos.map((bloco) => (
              <SelectItem key={bloco} value={bloco}>
                {bloco}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.tamanho ?? TODOS}
          onValueChange={(value) =>
            setFiltros((prev) => ({
              ...prev,
              tamanho: value === TODOS ? undefined : (value as Tamanho),
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os tamanhos</SelectItem>
            <SelectItem value="P">P</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="G">G</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando armários…</p>
      ) : armarios && armarios.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {armarios.map((armario) => (
            <ArmarioCard
              key={armario.id}
              armario={armario}
              podeFazerCheckIn={!jaTemArmario}
              isCheckingIn={
                checkInMutation.isPending &&
                checkInMutation.variables === armario.id
              }
              onCheckIn={handleCheckIn}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum armário encontrado com esses filtros.
        </p>
      )}
    </div>
  );
}
