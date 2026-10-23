"use client";

import {
  AlertTriangle,
  Battery,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EditarArmarioDialog } from "./EditarArmarioDialog";
import { NovoArmarioDialog } from "./NovoArmarioDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAberturaEmergenciaArmario,
  useDeleteArmario,
  useForcarLiberacaoArmario,
  useHigienizarArmario,
  useUpdateArmario,
} from "@/hooks/useArmarioMutations";
import { useArmarios } from "@/hooks/useArmarios";
import { ApiClientError } from "@/lib/apiClient";
import type { Armario, StatusArmario } from "@/types/armario";

export function ArmariosTable() {
  const { data: armarios, isLoading } = useArmarios();
  const updateStatusMutation = useUpdateArmario();
  const deleteArmarioMutation = useDeleteArmario();
  const forcarLiberacaoMutation = useForcarLiberacaoArmario();
  const aberturaEmergenciaMutation = useAberturaEmergenciaArmario();
  const higienizarMutation = useHigienizarArmario();

  const [armarioParaExcluir, setArmarioParaExcluir] = useState<Armario | null>(
    null
  );
  const [armarioParaEditar, setArmarioParaEditar] = useState<Armario | null>(
    null
  );
  const [armarioLiberacaoForcada, setArmarioLiberacaoForcada] =
    useState<Armario | null>(null);
  const [justificativaLiberacao, setJustificativaLiberacao] = useState("");
  const [armarioEmergencia, setArmarioEmergencia] = useState<Armario | null>(
    null
  );
  const [motivoEmergencia, setMotivoEmergencia] = useState("");
  const [pecasEmergencia, setPecasEmergencia] = useState("");

  function handleUpdateStatus(armarioId: string, status: StatusArmario) {
    updateStatusMutation.mutate(
      { armarioId, dadosAtualizacao: { status, modalidadeManutencao: null } },
      {
        onError: (error) => {
          const mensagem =
            error instanceof ApiClientError
              ? error.message
              : "Não foi possível atualizar o armário";
          toast.error(mensagem);
        },
      }
    );
  }

  function handleConfirmarLiberacaoForcada(e: React.FormEvent) {
    e.preventDefault();
    if (!armarioLiberacaoForcada) return;

    forcarLiberacaoMutation.mutate(
      {
        armarioId: armarioLiberacaoForcada.id,
        dados: { justificativa: justificativaLiberacao },
      },
      {
        onSuccess: () => {
          toast.success(
            "Armário liberado com sucesso e uso ativo encerrado na transação."
          );
          setJustificativaLiberacao("");
          setArmarioLiberacaoForcada(null);
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiClientError
              ? error.message
              : "Erro ao forçar liberação do armário"
          );
        },
      }
    );
  }

  function handleConfirmarAberturaEmergencia(e: React.FormEvent) {
    e.preventDefault();
    if (!armarioEmergencia) return;

    aberturaEmergenciaMutation.mutate(
      {
        armarioId: armarioEmergencia.id,
        dados: {
          motivo: motivoEmergencia,
          pecasAfetadas: pecasEmergencia || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.warning(
            "Abertura de Emergência concluída! Armário em MANUTENCAO_EMERGENCIAL e OS gerada automaticamente."
          );
          setMotivoEmergencia("");
          setPecasEmergencia("");
          setArmarioEmergencia(null);
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiClientError
              ? error.message
              : "Erro ao executar abertura de emergência"
          );
        },
      }
    );
  }

  function handleHigienizar(armarioId: string) {
    higienizarMutation.mutate(
      {
        armarioId,
        dados: { observacoes: "Sanitização concluída pelo painel" },
      },
      {
        onSuccess: () => {
          toast.success("Higienização registrada e contador de usos zerado!");
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiClientError
              ? error.message
              : "Erro ao registrar higienização"
          );
        },
      }
    );
  }

  function handleDelete() {
    if (!armarioParaExcluir) return;
    deleteArmarioMutation.mutate(armarioParaExcluir.id, {
      onSuccess: () => {
        toast.success("Armário excluído");
        setArmarioParaExcluir(null);
      },
      onError: (error) => {
        const mensagem =
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível excluir o armário";
        toast.error(mensagem);
        setArmarioParaExcluir(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Armários</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre armários, monitore ciclos de solenoide, bateria e gerencie
            manutenções.
          </p>
        </div>
        <NovoArmarioDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ciclos / Solenoide</TableHead>
                <TableHead>Telemetria</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(armarios ?? []).map((armario) => {
                const ciclos = armario.totalCiclosAbertura ?? 0;
                const alertaCiclos = ciclos >= 1000;
                const bateria = armario.nivelBateria ?? 100;
                const alertaBateria = bateria <= 25;

                return (
                  <TableRow key={armario.id}>
                    <TableCell className="font-medium">
                      {armario.numero}
                    </TableCell>
                    <TableCell>{armario.bloco}</TableCell>
                    <TableCell>{armario.tamanho}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={armario.status}
                        modalidadeManutencao={armario.modalidadeManutencao}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono">{ciclos} ciclos</span>
                        {alertaCiclos && (
                          <span
                            title="Inspeção Mecânica Preventiva necessária (>= 1.000 ciclos)"
                            className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400"
                          >
                            <AlertTriangle className="size-3" />
                            Preventiva
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Higienização: {armario.usosDesdeHigienizacao ?? 0}/30
                        usos
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Battery
                          className={
                            alertaBateria
                              ? "size-4 text-destructive"
                              : "size-4 text-muted-foreground"
                          }
                        />
                        <span
                          className={
                            alertaBateria ? "font-semibold text-destructive" : ""
                          }
                        >
                          {bateria}%
                        </span>
                        <span className="text-muted-foreground">
                          · {armario.temperatura ?? 24}°C
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal
                              className="size-4"
                              aria-hidden="true"
                            />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {armario.status === "MANUTENCAO" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(armario.id, "LIVRE")
                              }
                            >
                              Marcar como livre
                            </DropdownMenuItem>
                          )}
                          {armario.status === "OCUPADO" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setArmarioLiberacaoForcada(armario)
                                }
                              >
                                Forçar liberação (com justificativa)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setArmarioEmergencia(armario)}
                              >
                                Abertura de Emergência (gerar OS)
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleHigienizar(armario.id)}
                          >
                            <Sparkles className="mr-1.5 size-3.5" />
                            Registrar higienização
                          </DropdownMenuItem>
                          {armario.status !== "OCUPADO" && (
                            <DropdownMenuItem
                              onClick={() => setArmarioParaEditar(armario)}
                            >
                              Editar
                            </DropdownMenuItem>
                          )}
                          {armario.status !== "MANUTENCAO" &&
                            armario.status !== "OCUPADO" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(armario.id, "MANUTENCAO")
                                }
                              >
                                Enviar para manutenção
                              </DropdownMenuItem>
                            )}
                          {armario.status !== "OCUPADO" && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setArmarioParaExcluir(armario)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal MNT-02: Liberação Forçada com Justificativa */}
      <Dialog
        open={Boolean(armarioLiberacaoForcada)}
        onOpenChange={(open) => !open && setArmarioLiberacaoForcada(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Forçar liberação — Armário #{armarioLiberacaoForcada?.numero} (
              {armarioLiberacaoForcada?.bloco})
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleConfirmarLiberacaoForcada}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-muted-foreground">
              Esta operação executa uma transação atômica que encerra o{" "}
              <code>UsoArmario</code> aberto do aluno, libera o armário e grava
              a justificativa na auditoria.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="justificativa-liberacao">
                Justificativa obrigatória
              </Label>
              <Input
                id="justificativa-liberacao"
                required
                minLength={5}
                placeholder="Ex.: Aluno saiu da academia sem realizar check-out no app"
                value={justificativaLiberacao}
                onChange={(e) => setJustificativaLiberacao(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setArmarioLiberacaoForcada(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={forcarLiberacaoMutation.isPending}
              >
                {forcarLiberacaoMutation.isPending
                  ? "Liberando..."
                  : "Confirmar liberação forçada"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal MNT-01: Abertura de Emergência */}
      <Dialog
        open={Boolean(armarioEmergencia)}
        onOpenChange={(open) => !open && setArmarioEmergencia(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Abertura de Emergência — Armário #{armarioEmergencia?.numero} (
              {armarioEmergencia?.bloco})
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleConfirmarAberturaEmergencia}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-muted-foreground">
              Utilize quando a trava emperrar com pertences dentro. O uso do
              aluno será encerrado, o armário entrará em{" "}
              <code>MANUTENCAO_EMERGENCIAL</code> e uma Ordem de Serviço será
              aberta automaticamente.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="motivo-emergencia">Motivo da emergência</Label>
              <Input
                id="motivo-emergencia"
                required
                minLength={5}
                placeholder="Ex.: Solenoide travado com pertences do aluno no interior"
                value={motivoEmergencia}
                onChange={(e) => setMotivoEmergencia(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pecas-emergencia">
                Peças afetadas (opcional)
              </Label>
              <Input
                id="pecas-emergencia"
                placeholder="Ex.: Trava solenoide 12V / trinco metálico"
                value={pecasEmergencia}
                onChange={(e) => setPecasEmergencia(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setArmarioEmergencia(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={aberturaEmergenciaMutation.isPending}
              >
                {aberturaEmergenciaMutation.isPending
                  ? "Executando..."
                  : "Executar Abertura de Emergência"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(armarioParaExcluir)}
        onOpenChange={(open) => !open && setArmarioParaExcluir(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir armário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o armário{" "}
            {armarioParaExcluir?.numero} ({armarioParaExcluir?.bloco})? Essa
            ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArmarioParaExcluir(null)}
              disabled={deleteArmarioMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteArmarioMutation.isPending}
            >
              {deleteArmarioMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditarArmarioDialog
        armario={armarioParaEditar}
        onOpenChange={(open) => !open && setArmarioParaEditar(null)}
      />
    </div>
  );
}
