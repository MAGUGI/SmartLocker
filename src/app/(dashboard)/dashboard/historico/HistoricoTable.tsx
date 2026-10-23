"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { useUsos } from "@/hooks/useUsos";
import {
  formatarDataHora,
  formatarTempoDecorrido,
  ultrapassouLimiteAbandono,
} from "@/utils/date";

const FILTRO_TODOS = "todos";
const FILTRO_ATIVOS = "ativos";
const FILTRO_FINALIZADOS = "finalizados";
const FILTRO_ABANDONADOS = "abandonados";
const TAMANHO_PAGINA = 10;

export function HistoricoTable() {
  const [filtro, setFiltro] = useState(FILTRO_TODOS);
  const [pagina, setPagina] = useState(1);

  function handleFiltroChange(novoFiltro: string) {
    setFiltro(novoFiltro);
    setPagina(1);
  }

  const ativo =
    filtro === FILTRO_ATIVOS
      ? true
      : filtro === FILTRO_FINALIZADOS
        ? false
        : undefined;
  const abandonado = filtro === FILTRO_ABANDONADOS ? true : undefined;

  const { data: resultado, isLoading } = useUsos({
    ativo,
    abandonado,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de uso</h1>
        <p className="text-sm text-muted-foreground">
          Check-ins, check-outs, alertas de abandono (&gt;3h) e tarifação PIX.
        </p>
      </div>

      <Select value={filtro} onValueChange={handleFiltroChange}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTRO_TODOS}>Todos</SelectItem>
          <SelectItem value={FILTRO_ATIVOS}>Em uso</SelectItem>
          <SelectItem value={FILTRO_FINALIZADOS}>Finalizados</SelectItem>
          <SelectItem value={FILTRO_ABANDONADOS}>
            Retidos / Abandonados (&gt;3h)
          </SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : resultado && resultado.dados.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Armário</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out / Status</TableHead>
                  <TableHead>Tarifação PIX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.dados.map((uso) => {
                  const emAbandono =
                    uso.abandonado ||
                    (!uso.checkOut && ultrapassouLimiteAbandono(uso.checkIn));
                  return (
                    <TableRow key={uso.id}>
                      <TableCell>
                        <p className="font-medium">{uso.user.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {uso.user.matricula ?? "Anonimizado"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {uso.armario.numero} · {uso.armario.bloco} (
                        {uso.armario.tamanho})
                      </TableCell>
                      <TableCell>{formatarDataHora(uso.checkIn)}</TableCell>
                      <TableCell>
                        {uso.checkOut ? (
                          <div>
                            <p>{formatarDataHora(uso.checkOut)}</p>
                            {uso.justificativaLiberacao && (
                              <p className="text-[11px] text-muted-foreground">
                                Obs: {uso.justificativaLiberacao}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-status-ocupado">
                              Em uso ({formatarTempoDecorrido(uso.checkIn)})
                            </span>
                            {emAbandono && (
                              <span className="text-xs font-semibold text-destructive">
                                Alerta RN1: Retido &gt; 3h
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {uso.valorCobrado && uso.valorCobrado > 0 ? (
                          <span className="font-mono font-medium">
                            R$ {uso.valorCobrado.toFixed(2)} (
                            {uso.statusPagamento})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Isento (Franquia 3h)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {resultado.totalPaginas > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm text-muted-foreground tabular-nums">
                {resultado.total} registro{resultado.total === 1 ? "" : "s"} ·
                página {resultado.pagina} de {resultado.totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina >= resultado.totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum registro encontrado.
        </p>
      )}
    </div>
  );
}
