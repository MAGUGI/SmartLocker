"use client";

import { CalendarCheck, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useCriarInspecao, useInspecoes } from "@/hooks/useOperacoes";
import { formatarDataHora } from "@/utils/date";

export function InspecoesView() {
  const { data: inspecoes, isLoading } = useInspecoes();
  const criarInspecaoMutation = useCriarInspecao();

  const [bloco, setBloco] = useState("Bloco A");
  const [dataProgramada, setDataProgramada] = useState("2026-11-05T09:00");
  const [alinhamentoOk, setAlinhamentoOk] = useState(true);
  const [vedacaoOk, setVedacaoOk] = useState(true);
  const [sensoresOk, setSensoresOk] = useState(true);
  const [observacoes, setObservacoes] = useState("");

  function handleAgendarInspecao(e: React.FormEvent) {
    e.preventDefault();
    criarInspecaoMutation.mutate(
      {
        bloco,
        dataProgramada: new Date(dataProgramada).toISOString(),
        alinhamentoOk,
        vedacaoOk,
        sensoresOk,
        observacoes: observacoes || undefined,
        concluida: alinhamentoOk && vedacaoOk && sensoresOk,
      },
      {
        onSuccess: () => {
          toast.success(
            "Inspeção física preventiva registrada no calendário mensal!"
          );
          setObservacoes("");
        },
        onError: () => {
          toast.error("Erro ao registrar inspeção física");
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Calendário Mensal de Inspeções Físicas Preventivas
        </h1>
        <p className="text-sm text-muted-foreground">
          Programação mensal por bloco com checklist padronizado de alinhamento
          de portas, vedação e sensores ópticos/magnéticos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4 text-primary" />
            Novo Checklist de Inspeção Preventiva por Bloco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAgendarInspecao}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="insp-bloco">Bloco / Vestiário</Label>
              <Input
                id="insp-bloco"
                required
                value={bloco}
                onChange={(e) => setBloco(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insp-data">Data e Hora Programada</Label>
              <Input
                id="insp-data"
                type="datetime-local"
                required
                value={dataProgramada}
                onChange={(e) => setDataProgramada(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insp-obs">Observações Técnicas</Label>
              <Input
                id="insp-obs"
                placeholder="Ex.: Dobradiças lubrificadas"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={alinhamentoOk}
                  onChange={(e) => setAlinhamentoOk(e.target.checked)}
                />
                Alinhamento de portas OK
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vedacaoOk}
                  onChange={(e) => setVedacaoOk(e.target.checked)}
                />
                Vedação e borracha OK
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sensoresOk}
                  onChange={(e) => setSensoresOk(e.target.checked)}
                />
                Sensores e solenoides OK
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                disabled={criarInspecaoMutation.isPending}
              >
                <Plus className="size-4" />
                Registrar no Calendário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando calendário de inspeções…
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bloco</TableHead>
                <TableHead>Data Programada</TableHead>
                <TableHead>Checklist (Alinhamento / Vedação / Sensores)</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inspecoes ?? []).map((insp) => (
                <TableRow key={insp.id}>
                  <TableCell className="font-medium">{insp.bloco}</TableCell>
                  <TableCell>{formatarDataHora(insp.dataProgramada)}</TableCell>
                  <TableCell className="text-xs">
                    Alinhamento: {insp.alinhamentoOk ? "OK" : "Falha"} ·
                    Vedação: {insp.vedacaoOk ? "OK" : "Falha"} · Sensores:{" "}
                    {insp.sensoresOk ? "OK" : "Falha"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {insp.observacoes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-status-livre">
                      <CheckCircle2 className="size-3.5" />
                      {insp.concluida ? "Concluída" : "Agendada"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
