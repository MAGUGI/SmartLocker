"use client";

import {
  AlertTriangle,
  Clock,
  KeyRound,
  Loader2,
  LockKeyholeOpen,
  WifiOff,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { QrCodeMatrix } from "@/components/QrCodeMatrix";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { useCheckOut } from "@/hooks/useCheckOut";
import { useMeuUso } from "@/hooks/useMeuUso";
import { useCriarRelatoProblema } from "@/hooks/useOperacoes";
import { ApiClientError } from "@/lib/apiClient";
import type { CategoriaProblemaArmario, UsoArmarioResumo } from "@/types/armario";
import {
  formatarDataHora,
  formatarTempoDecorrido,
  ultrapassouLimiteAbandono,
} from "@/utils/date";

const CHAVE_CACHE_OFFLINE = "smartlocker:meu-armario-cache-v1";

export function MeuArmarioView() {
  const { data: usoRemoto, isLoading, isError } = useMeuUso();
  const checkOutMutation = useCheckOut();
  const criarRelatoMutation = useCriarRelatoProblema();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogProblemaAberto, setDialogProblemaAberto] = useState(false);
  const [categoriaProblema, setCategoriaProblema] =
    useState<CategoriaProblemaArmario>("TRAVA_EMPERRADA");
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [usoOfflineCache, setUsoOfflineCache] =
    useState<UsoArmarioResumo | null>(null);
  const [modoOffline, setModoOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const salvo = window.localStorage.getItem(CHAVE_CACHE_OFFLINE);
    if (salvo) {
      try {
        setUsoOfflineCache(JSON.parse(salvo) as UsoArmarioResumo);
      } catch {
        window.localStorage.removeItem(CHAVE_CACHE_OFFLINE);
      }
    }

    const atualizarStatusRede = () => setModoOffline(!navigator.onLine);
    atualizarStatusRede();
    window.addEventListener("online", atualizarStatusRede);
    window.addEventListener("offline", atualizarStatusRede);
    return () => {
      window.removeEventListener("online", atualizarStatusRede);
      window.removeEventListener("offline", atualizarStatusRede);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isLoading || isError) return;
    if (usoRemoto) {
      window.localStorage.setItem(
        CHAVE_CACHE_OFFLINE,
        JSON.stringify(usoRemoto)
      );
      setUsoOfflineCache(usoRemoto);
    } else if (usoRemoto === null) {
      window.localStorage.removeItem(CHAVE_CACHE_OFFLINE);
      setUsoOfflineCache(null);
    }
  }, [usoRemoto, isLoading, isError]);

  const uso = usoRemoto ?? (modoOffline || isError ? usoOfflineCache : null);

  function handleCheckOut() {
    checkOutMutation.mutate(undefined, {
      onSuccess: (usoFinalizado) => {
        setDialogAberto(false);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(CHAVE_CACHE_OFFLINE);
        }
        if (usoFinalizado.valorCobrado && usoFinalizado.valorCobrado > 0) {
          toast.warning(
            `Check-out realizado. Tempo excedente tarifado em R$ ${usoFinalizado.valorCobrado.toFixed(2)} via PIX.`
          );
        } else {
          toast.success("Check-out realizado dentro da franquia gratuita!");
        }
      },
      onError: (error) => {
        const mensagem =
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível fazer o check-out";
        toast.error(mensagem);
      },
    });
  }

  function handleReportarProblema(e: React.FormEvent) {
    e.preventDefault();
    if (!uso) return;

    criarRelatoMutation.mutate(
      {
        armarioId: uso.armarioId,
        categoria: categoriaProblema,
        descricao: descricaoProblema,
      },
      {
        onSuccess: () => {
          toast.success(
            "Problema reportado! A administração recebeu um alerta prioritário."
          );
          setDescricaoProblema("");
          setDialogProblemaAberto(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiClientError
              ? error.message
              : "Erro ao enviar relato de avaria"
          );
        },
      }
    );
  }

  if (isLoading && !uso) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!uso) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-muted">
          <LockKeyholeOpen
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <div>
          <p className="font-medium">Você não está com nenhum armário</p>
          <p className="text-sm text-muted-foreground">
            Escolha um armário livre para começar.
          </p>
        </div>
        <Button asChild size="touch">
          <Link href="/armarios">Ver armários disponíveis</Link>
        </Button>
      </div>
    );
  }

  const excedeuFranquia3h = ultrapassouLimiteAbandono(uso.checkIn);
  const tempoDecorrido = formatarTempoDecorrido(uso.checkIn);
  const pinExibicao = uso.pinAcesso ?? "------";
  const payloadQr = `SMARTLOCKER:${uso.armario.id}:PIN:${pinExibicao}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu armário</h1>
        <p className="text-sm text-muted-foreground">
          Utilize o PIN de 6 dígitos ou QR Code abaixo para destravar seu
          armário no vestiário.
        </p>
      </div>

      {(modoOffline || isError) && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <WifiOff className="size-4 shrink-0" aria-hidden="true" />
          <span>
            Modo de contingência offline (PWA ativo): exibindo número e PIN
            salvos localmente no dispositivo.
          </span>
        </div>
      )}

      {excedeuFranquia3h && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span>
            Alerta de tempo excedido (RN1): seu uso ultrapassou a franquia
            gratuita de 3 horas ({tempoDecorrido}). Horas adicionais são
            tarifadas no check-out via PIX.
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Armário
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {uso.armario.numero}
              </p>
              <p className="text-xs text-muted-foreground">
                {uso.armario.bloco} · Tam. {uso.armario.tamanho}
              </p>
            </div>
            <StatusBadge
              status={uso.armario.status}
              modalidadeManutencao={uso.armario.modalidadeManutencao}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Check-in em {formatarDataHora(uso.checkIn)}
            </p>
            <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs font-medium">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              <span>
                Tempo decorrido: <strong>{tempoDecorrido}</strong> (Franquia
                gratuita: 3h)
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button className="w-full" size="touch" variant="destructive">
                  Fazer check-out
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar check-out</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Isso vai liberar o armário {uso.armario.numero} (
                  {uso.armario.bloco}) para outro aluno. Confirma que já pegou
                  seus pertences?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogAberto(false)}
                    disabled={checkOutMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                  >
                    {checkOutMutation.isPending ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      "Confirmar check-out"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={dialogProblemaAberto}
              onOpenChange={setDialogProblemaAberto}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  type="button"
                >
                  <Wrench className="size-4" aria-hidden="true" />
                  Reportar problema no armário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Reportar problema — Armário #{uso.armario.numero}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleReportarProblema}
                  className="flex flex-col gap-4"
                >
                  <div className="space-y-1.5">
                    <Label>Categoria da avaria</Label>
                    <Select
                      value={categoriaProblema}
                      onValueChange={(v) =>
                        setCategoriaProblema(v as CategoriaProblemaArmario)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRAVA_EMPERRADA">
                          Trava emperrada
                        </SelectItem>
                        <SelectItem value="PORTA_DANIFICADA">
                          Porta danificada
                        </SelectItem>
                        <SelectItem value="SUJEIRA">
                          Necessidade de limpeza / sujeira
                        </SelectItem>
                        <SelectItem value="OUTRO">Outro problema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="desc-problema">Descrição detalhada</Label>
                    <Input
                      id="desc-problema"
                      required
                      minLength={5}
                      placeholder="Ex.: A trava eletrônica faz barulho mas não abre"
                      value={descricaoProblema}
                      onChange={(e) => setDescricaoProblema(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogProblemaAberto(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={criarRelatoMutation.isPending}
                    >
                      {criarRelatoMutation.isPending
                        ? "Enviando..."
                        : "Enviar alerta prioritário"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" aria-hidden="true" />
              <p className="font-semibold">Credencial Física de Abertura</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o PIN no teclado do armário ou aproxime o QR Code no leitor
              óptico.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-muted/50 px-6 py-3 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                PIN Temporário (6 dígitos)
              </p>
              <p className="font-mono text-3xl font-bold tracking-widest text-primary">
                {pinExibicao}
              </p>
            </div>
            <QrCodeMatrix value={payloadQr} size={148} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
