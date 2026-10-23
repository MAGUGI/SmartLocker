"use client";

import {
  Activity,
  AlertTriangle,
  BatteryWarning,
  CheckCircle2,
  Clock,
  LayoutGrid,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { StatBadge } from "./StatBadge";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useArmarios } from "@/hooks/useArmarios";
import {
  useDiagnosticoSaude,
  useRelatosProblema,
  useTelemetria,
} from "@/hooks/useOperacoes";
import { useUsos } from "@/hooks/useUsos";
import { dispararVerificacaoAbandonoApi } from "@/services/operacoes.service";
import type { StatusArmario } from "@/types/armario";
import {
  formatarTempoDecorrido,
  ultrapassouLimiteAbandono,
} from "@/utils/date";

export function DashboardOverview() {
  const { data: armarios, isLoading } = useArmarios();
  const { data: relatosPendentes } = useRelatosProblema(true);
  const { data: usosAtivos } = useUsos({ ativo: true, tamanhoPagina: 50 });
  const { data: saude } = useDiagnosticoSaude();
  const { data: telemetriaRecente } = useTelemetria();

  const total = armarios?.length ?? 0;
  const contagemPorStatus = (status: StatusArmario) =>
    armarios?.filter((armario) => armario.status === status).length ?? 0;

  const blocos = Array.from(
    new Set((armarios ?? []).map((armario) => armario.bloco))
  ).sort();

  const armariosBateriaBaixa = (armarios ?? []).filter(
    (a) => (a.nivelBateria ?? 100) <= 25
  );
  const armariosPortaAberta = (armarios ?? []).filter((a) => a.portaAberta);
  const usosRetidosMais3h = (usosAtivos?.dados ?? []).filter(
    (u) => u.abandonado || ultrapassouLimiteAbandono(u.checkIn)
  );

  async function handleExecutarCronAbandono() {
    try {
      const res = await dispararVerificacaoAbandonoApi();
      toast.success(
        `Verificação concluída: ${res.quantidadeRetidos} armário(s) marcado(s) como retido(s).`
      );
    } catch {
      toast.error("Falha ao executar verificação de armários abandonados.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ocupação</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral dos armários, telemetria IoT e alertas operacionais em
            tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saude && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">
              <Activity className="size-3.5 text-status-livre" />
              DB: {saude.servicos.postgresql.latenciaMs}ms · MQTT:{" "}
              {saude.servicos.mqtt.conectado ? "Online" : "Offline"}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExecutarCronAbandono}
          >
            <Clock className="mr-1.5 size-4" aria-hidden="true" />
            Verificar abandono (&gt;3h)
          </Button>
        </div>
      </div>

      {relatosPendentes && relatosPendentes.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
            Alertas Prioritários de Avaria Reportados pelos Alunos (
            {relatosPendentes.length})
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {relatosPendentes.slice(0, 5).map((relato) => (
              <li key={relato.id}>
                <strong>
                  Armário #{relato.armario?.numero} ({relato.armario?.bloco})
                </strong>{" "}
                — [{relato.categoria}]: {relato.descricao} (Reportado por{" "}
                {relato.user?.nome})
              </li>
            ))}
          </ul>
        </div>
      )}

      {usosRetidosMais3h.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">
            Controle de Abandono (RN1): {usosRetidosMais3h.length} armário(s) em
            uso há mais de 3 horas
          </p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {usosRetidosMais3h.map((u) => (
              <li key={u.id}>
                Armário #{u.armario.numero} ({u.armario.bloco}) — Aluno:{" "}
                {u.user.nome} ({formatarTempoDecorrido(u.checkIn)} decorridos)
              </li>
            ))}
          </ul>
        </div>
      )}

      {(armariosBateriaBaixa.length > 0 || armariosPortaAberta.length > 0) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
            <BatteryWarning className="size-4" aria-hidden="true" />
            Telemetria Preditiva IoT (Bateria e Sensores de Porta)
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {armariosBateriaBaixa.length} armário(s) com bateria &lt;= 25% ·{" "}
            {armariosPortaAberta.length} armário(s) com sensor de porta aberta
            ativo · {telemetriaRecente?.length ?? 0} leituras recentes.
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={total} icon={LayoutGrid} />
            <StatCard
              label="Livres"
              value={contagemPorStatus("LIVRE")}
              icon={CheckCircle2}
              className="text-status-livre"
            />
            <StatCard
              label="Ocupados"
              value={contagemPorStatus("OCUPADO")}
              icon={User}
              className="text-status-ocupado"
            />
            <StatCard
              label="Manutenção"
              value={contagemPorStatus("MANUTENCAO")}
              icon={Wrench}
              className="text-status-manutencao"
            />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Livres</TableHead>
                  <TableHead>Ocupados</TableHead>
                  <TableHead>Manutenção</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocos.map((bloco) => {
                  const doBloco = (armarios ?? []).filter(
                    (armario) => armario.bloco === bloco
                  );
                  return (
                    <TableRow key={bloco}>
                      <TableCell className="font-medium">{bloco}</TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "LIVRE").length
                          }
                          tone="livre"
                        />
                      </TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "OCUPADO").length
                          }
                          tone="ocupado"
                        />
                      </TableCell>
                      <TableCell>
                        <StatBadge
                          value={
                            doBloco.filter((a) => a.status === "MANUTENCAO")
                              .length
                          }
                          tone="manutencao"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doBloco.length}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
