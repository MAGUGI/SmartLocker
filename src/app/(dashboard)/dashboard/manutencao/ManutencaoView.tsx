"use client";

import { CheckCircle2, Plus, QrCode, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { QrCodeMatrix } from "@/components/QrCodeMatrix";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHigienizarArmario } from "@/hooks/useArmarioMutations";
import { useArmarios } from "@/hooks/useArmarios";
import {
  useAtualizarOrdemManutencao,
  useCriarOrdemManutencao,
  useOrdensManutencao,
  useRelatosProblema,
} from "@/hooks/useOperacoes";
import { ApiClientError } from "@/lib/apiClient";
import type { OrdemManutencao, TipoOrdemManutencao } from "@/types/armario";
import { formatarDataHora } from "@/utils/date";

export function ManutencaoView() {
  const { data: ordens, isLoading } = useOrdensManutencao();
  const { data: relatos } = useRelatosProblema(false);
  const { data: armarios } = useArmarios();
  const criarOrdemMutation = useCriarOrdemManutencao();
  const atualizarOrdemMutation = useAtualizarOrdemManutencao();
  const higienizarMutation = useHigienizarArmario();

  const [novaOsAberta, setNovaOsAberta] = useState(false);
  const [armarioId, setArmarioId] = useState("");
  const [tipo, setTipo] = useState<TipoOrdemManutencao>("CORRETIVA");
  const [descricao, setDescricao] = useState("");
  const [pecasTrocadas, setPecasTrocadas] = useState("");
  const [custo, setCusto] = useState("0");

  const [osParaConcluir, setOsParaConcluir] = useState<OrdemManutencao | null>(
    null
  );
  const [pecasConclusao, setPecasConclusao] = useState("");
  const [custoConclusao, setCustoConclusao] = useState("0");
  const [testadoAntesReativar, setTestadoAntesReativar] = useState(false);
  const [armarioQrLimpeza, setArmarioQrLimpeza] = useState<string | null>(null);

  function handleCriarOrdem(e: React.FormEvent) {
    e.preventDefault();
    criarOrdemMutation.mutate(
      {
        armarioId,
        tipo,
        descricao,
        pecasTrocadas: pecasTrocadas || undefined,
        custo: Number(custo) || 0,
      },
      {
        onSuccess: () => {
          toast.success("Ordem de Serviço aberta com sucesso!");
          setNovaOsAberta(false);
          setDescricao("");
          setPecasTrocadas("");
          setCusto("0");
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError
              ? err.message
              : "Erro ao criar Ordem de Serviço"
          );
        },
      }
    );
  }

  function handleConcluirEReativar(e: React.FormEvent) {
    e.preventDefault();
    if (!osParaConcluir) return;

    atualizarOrdemMutation.mutate(
      {
        ordemId: osParaConcluir.id,
        status: "CONCLUIDA",
        pecasTrocadas: pecasConclusao || undefined,
        custo: Number(custoConclusao) || 0,
        testadoAntesReativar,
        reativarArmario: true,
      },
      {
        onSuccess: () => {
          toast.success(
            "Ordem de Serviço concluída e armário reativado após validação de teste!"
          );
          setOsParaConcluir(null);
          setTestadoAntesReativar(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError
              ? err.message
              : "Não foi possível concluir a Ordem de Serviço"
          );
        },
      }
    );
  }

  function handleHigienizarMobileQr(idArmario: string) {
    higienizarMutation.mutate(
      {
        armarioId: idArmario,
        dados: {
          codigoQr: `HIGIENIZACAO-QR-${idArmario}`,
          observacoes: "Higienização confirmada via leitura mobile QR Code",
        },
      },
      {
        onSuccess: () => {
          toast.success("Sanitização confirmada via QR Code e armário liberado!");
          setArmarioQrLimpeza(null);
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestão de Ordens de Serviço (OS) e Higienização
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de reparos, peças trocadas, custos, validação de teste e
            sanitização periódica por QR Code.
          </p>
        </div>

        <Dialog open={novaOsAberta} onOpenChange={setNovaOsAberta}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" aria-hidden="true" />
              Nova Ordem de Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Ordem de Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCriarOrdem} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label>Armário</Label>
                <Select value={armarioId} onValueChange={setArmarioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o armário" />
                  </SelectTrigger>
                  <SelectContent>
                    {(armarios ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        Armário #{a.numero} ({a.bloco}) — {a.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Manutenção</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => setTipo(v as TipoOrdemManutencao)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                    <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                    <SelectItem value="PREDITIVA">Preditiva</SelectItem>
                    <SelectItem value="HIGIENIZACAO">Higienização</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os-desc">Descrição do Serviço</Label>
                <Input
                  id="os-desc"
                  required
                  minLength={5}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: Substituição de mola e ajuste da fechadura"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os-pecas">Peças Trocadas (opcional)</Label>
                <Input
                  id="os-pecas"
                  value={pecasTrocadas}
                  onChange={(e) => setPecasTrocadas(e.target.value)}
                  placeholder="Ex.: Solenoide 12V"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os-custo">Custo Estimado (R$)</Label>
                <Input
                  id="os-custo"
                  type="number"
                  step="0.01"
                  min={0}
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!armarioId || criarOrdemMutation.isPending}
                >
                  {criarOrdemMutation.isPending ? "Abrindo..." : "Criar OS"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MNT-09: Painel Mobile de Higienização por QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Controle de Higienização Periódica (A cada 30 usos ou 7 dias) —
            Interface Equipe de Limpeza
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {(armarios ?? []).slice(0, 6).map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={
                a.modalidadeManutencao === "HIGIENIZACAO"
                  ? "default"
                  : "outline"
              }
              className="gap-1.5"
              onClick={() => setArmarioQrLimpeza(a.id)}
            >
              <QrCode className="size-3.5" />#{a.numero} ({a.bloco}) ·{" "}
              {a.usosDesdeHigienizacao ?? 0}/30
            </Button>
          ))}
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando Ordens de Serviço…
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Armário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição / Peças</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ordens ?? []).map((os) => (
                <TableRow key={os.id}>
                  <TableCell className="font-medium">
                    #{os.armario?.numero} · {os.armario?.bloco}
                  </TableCell>
                  <TableCell>{os.tipo}</TableCell>
                  <TableCell>
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                      {os.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs">
                    <p>{os.descricao}</p>
                    {os.pecasTrocadas && (
                      <p className="text-muted-foreground">
                        Peças: {os.pecasTrocadas}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    R$ {(os.custo ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatarDataHora(os.createdAt)}
                  </TableCell>
                  <TableCell>
                    {os.status !== "CONCLUIDA" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          setOsParaConcluir(os);
                          setPecasConclusao(os.pecasTrocadas ?? "");
                          setCustoConclusao(String(os.custo ?? 0));
                          setTestadoAntesReativar(false);
                        }}
                      >
                        <Wrench className="size-3.5" />
                        Concluir e Reativar
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-status-livre">
                        <CheckCircle2 className="size-3.5" />
                        Testado e Ativo
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Relatos de Problemas recebidos dos alunos */}
      {relatos && relatos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Relatos de Problemas Enviados pelos Alunos ({relatos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Armário</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatos.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        #{r.armario?.numero} ({r.armario?.bloco})
                      </TableCell>
                      <TableCell>{r.categoria}</TableCell>
                      <TableCell>{r.descricao}</TableCell>
                      <TableCell>{r.user?.nome}</TableCell>
                      <TableCell>
                        {r.resolvido ? "Resolvido" : "Pendente"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de conclusão de OS com teste obrigatório antes de reativar */}
      <Dialog
        open={Boolean(osParaConcluir)}
        onOpenChange={(open) => !open && setOsParaConcluir(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Concluir Ordem de Serviço e Reativar Armário
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleConcluirEReativar}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="concl-pecas">Peças Trocadas</Label>
              <Input
                id="concl-pecas"
                value={pecasConclusao}
                onChange={(e) => setPecasConclusao(e.target.value)}
                placeholder="Ex.: Trava solenoide substituída"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="concl-custo">Custo Final (R$)</Label>
              <Input
                id="concl-custo"
                type="number"
                step="0.01"
                min={0}
                value={custoConclusao}
                onChange={(e) => setCustoConclusao(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                checked={testadoAntesReativar}
                onChange={(e) => setTestadoAntesReativar(e.target.checked)}
              />
              <span>
                Confirmo que o teste físico de abertura e fechamento da trava
                foi executado com sucesso antes da reativação.
              </span>
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOsParaConcluir(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !testadoAntesReativar || atualizarOrdemMutation.isPending
                }
              >
                Confirmar Teste e Reativar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Mobile QR Code de Higienização */}
      <Dialog
        open={Boolean(armarioQrLimpeza)}
        onOpenChange={(open) => !open && setArmarioQrLimpeza(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Check-in Mobile de Higienização via QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <QrCodeMatrix
              value={`SMARTLOCKER:HIGIENIZAR:${armarioQrLimpeza}`}
              size={140}
            />
            <p className="text-center text-xs text-muted-foreground">
              Escaneie o QR Code na porta do armário ou confirme abaixo para
              registrar a sanitização e zerar o contador de 30 usos.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArmarioQrLimpeza(null)}
            >
              Fechar
            </Button>
            <Button
              onClick={() =>
                armarioQrLimpeza && handleHigienizarMobileQr(armarioQrLimpeza)
              }
            >
              Confirmar Sanitização Concluída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
