"use client";

import { DatabaseZap, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuditoria } from "@/hooks/useOperacoes";
import { dispararExpurgoRegistrosApi } from "@/services/operacoes.service";
import { formatarDataHora } from "@/utils/date";

export function AuditoriaView() {
  const [pagina, setPagina] = useState(1);
  const { data: resultado, isLoading } = useAuditoria({ pagina });

  async function handleExecutarExpurgo() {
    try {
      const res = await dispararExpurgoRegistrosApi();
      toast.success(
        `Expurgo concluído: ${res.tentativasRemovidas} tentativa(s) antiga(s) removida(s) e ${res.usosArquivados} histórico(s) arquivado(s).`
      );
    } catch {
      toast.error("Erro ao executar rotina de expurgo de banco de dados.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="size-6 text-primary" />
            Trilha de Auditoria Imutável (Append-Only)
          </h1>
          <p className="text-sm text-muted-foreground">
            Rastreabilidade de ações críticas com operador, endereço IP,
            User-Agent e carimbo de tempo (RF13).
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExecutarExpurgo}>
          <DatabaseZap className="mr-1.5 size-4" />
          Executar Expurgo &gt;2d / Retenção 90d
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando registros de auditoria…
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>IP / User-Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(resultado?.dados ?? []).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatarDataHora(log.criadoEm)}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {log.operador?.nome ?? "Sistema / Automatizado"}
                  </TableCell>
                  <TableCell>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                      {log.acao}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.entidade} {log.entidadeId ? `(${log.entidadeId})` : ""}
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    {log.detalhes ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                    {log.ip} · {log.userAgent}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Página {pagina}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pagina <= 1}
            onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={(resultado?.dados?.length ?? 0) === 0}
            onClick={() => setPagina((atual) => atual + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
