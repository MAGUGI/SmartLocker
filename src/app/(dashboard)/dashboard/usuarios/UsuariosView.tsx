"use client";

import { KeyRound, Lock, Search, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useAtualizarUsuarioAdmin,
  useUsuariosAdmin,
} from "@/hooks/useOperacoes";
import { ApiClientError } from "@/lib/apiClient";
import type { UsuarioResumo } from "@/types/armario";

export function UsuariosView() {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const { data: resultado, isLoading } = useUsuariosAdmin({ busca, pagina });
  const atualizarUsuarioMutation = useAtualizarUsuarioAdmin();

  const [usuarioParaSenha, setUsuarioParaSenha] =
    useState<UsuarioResumo | null>(null);
  const [novaSenha, setNovaSenha] = useState("");

  function handleAlternarBloqueio(usuario: UsuarioResumo) {
    atualizarUsuarioMutation.mutate(
      {
        userId: usuario.id,
        bloqueado: !usuario.bloqueado,
      },
      {
        onSuccess: () => {
          toast.success(
            usuario.bloqueado
              ? `Matrícula de ${usuario.nome} desbloqueada`
              : `Matrícula de ${usuario.nome} bloqueada`
          );
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError
              ? err.message
              : "Não foi possível alterar o status do usuário"
          );
        },
      }
    );
  }

  function handleRedefinirSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioParaSenha) return;

    atualizarUsuarioMutation.mutate(
      {
        userId: usuarioParaSenha.id,
        novaSenha,
      },
      {
        onSuccess: () => {
          toast.success(`Senha de ${usuarioParaSenha.nome} redefinida!`);
          setNovaSenha("");
          setUsuarioParaSenha(null);
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError
              ? err.message
              : "Erro ao redefinir senha"
          );
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestão Administrativa de Usuários
        </h1>
        <p className="text-sm text-muted-foreground">
          Listagem paginada, busca por nome/matrícula, redefinição de senha e
          bloqueio preventivo de matrícula.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search
          className=" absolute left-3 top-2.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, e-mail ou matrícula…"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando usuários…</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(resultado?.dados ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.matricula ?? "—"}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    {u.bloqueado ? (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="rounded-full bg-status-livre/15 px-2 py-0.5 text-xs font-medium text-status-livre">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setUsuarioParaSenha(u)}
                    >
                      <KeyRound className="size-3.5" />
                      Redefinir senha
                    </Button>
                    {u.role !== "ADMIN" && (
                      <Button
                        size="sm"
                        variant={u.bloqueado ? "outline" : "destructive"}
                        className="gap-1"
                        onClick={() => handleAlternarBloqueio(u)}
                      >
                        {u.bloqueado ? (
                          <>
                            <Unlock className="size-3.5" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5" />
                            Bloquear
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(usuarioParaSenha)}
        onOpenChange={(open) => !open && setUsuarioParaSenha(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Redefinir senha — {usuarioParaSenha?.nome}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleRedefinirSenha}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-nova-senha">
                Nova senha temporária (mín. 8 caracteres, letras e números)
              </Label>
              <Input
                id="admin-nova-senha"
                type="password"
                required
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Ex.: Aluno2026"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUsuarioParaSenha(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={atualizarUsuarioMutation.isPending}
              >
                Salvar nova senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
