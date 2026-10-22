"use client";

import { Download, ShieldAlert, UserCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { PasswordInput } from "@/components/ui/password-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtualizarPerfil, usePerfil } from "@/hooks/useOperacoes";
import { ApiClientError } from "@/lib/apiClient";
import {
  anonimizarContaLgpdApi,
  exportarDadosLgpdApi,
} from "@/services/operacoes.service";
import { formatarDataHora } from "@/utils/date";

export function PerfilView() {
  const { data: perfil, isLoading } = usePerfil();
  const atualizarPerfilMutation = useAtualizarPerfil();

  const [nome, setNome] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [dialogLgpdAberto, setDialogLgpdAberto] = useState(false);
  const [processandoLgpd, setProcessandoLgpd] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando perfil…</p>;
  }

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    atualizarPerfilMutation.mutate(
      {
        nome: nome.trim() || perfil?.nome,
        ...(novaSenha ? { senhaAtual, novaSenha } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Dados de perfil atualizados com sucesso!");
          setSenhaAtual("");
          setNovaSenha("");
        },
        onError: (error) => {
          const mensagem =
            error instanceof ApiClientError
              ? error.message
              : "Não foi possível atualizar o perfil";
          toast.error(mensagem);
        },
      }
    );
  }

  async function handleExportarDadosLgpd() {
    try {
      const dados = await exportarDadosLgpdApi();
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `smartlocker-dados-pessoais-${perfil?.matricula ?? "titular"}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação de dados pessoais (JSON) concluída!");
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Erro ao exportar dados pessoais"
      );
    }
  }

  async function handleAnonimizarConta() {
    setProcessandoLgpd(true);
    try {
      const resposta = await anonimizarContaLgpdApi();
      toast.success(resposta.mensagem);
      setDialogLgpdAberto(false);
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível anonimizar a conta"
      );
    } finally {
      setProcessandoLgpd(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados cadastrais, credenciais de segurança, histórico
          pessoal e privacidade LGPD.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="size-5 text-primary" aria-hidden="true" />
              Dados Cadastrais e Senha
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSalvarPerfil}>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="perfil-nome">Nome completo</Label>
                <Input
                  id="perfil-nome"
                  defaultValue={perfil?.nome ?? ""}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={perfil?.email ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Matrícula</Label>
                <Input value={perfil?.matricula ?? "N/A (Admin)"} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha-atual">
                  Senha atual (para alterar a senha)
                </Label>
                <PasswordInput
                  id="senha-atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Informe sua senha atual"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nova-senha">
                  Nova senha (mín. 8 caracteres, letras e números)
                </Label>
                <PasswordInput
                  id="nova-senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={atualizarPerfilMutation.isPending}
              >
                {atualizarPerfilMutation.isPending
                  ? "Salvando..."
                  : "Salvar alterações"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
              Privacidade e Direitos do Titular (LGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (RNF06), você
              pode exportar todos os seus dados pessoais e histórico em formato
              JSON ou solicitar a exclusão e anonimização irreversível da sua
              conta.
            </p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleExportarDadosLgpd}
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar meus dados pessoais (JSON)
            </Button>

            <Dialog
              open={dialogLgpdAberto}
              onOpenChange={setDialogLgpdAberto}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Excluir conta e anonimizar histórico (LGPD)
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Confirmar anonimização e exclusão de conta
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Seus dados pessoais (nome, e-mail e matrícula) serão
                  substituídos por identificadores anônimos e o histórico de
                  uso de armários será desvinculado da sua identidade. Esta ação
                  é irreversível.
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogLgpdAberto(false)}
                    disabled={processandoLgpd}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleAnonimizarConta}
                    disabled={processandoLgpd}
                  >
                    {processandoLgpd
                      ? "Anonimizando..."
                      : "Confirmar exclusão LGPD"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meu Histórico Recente de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          {perfil?.usos && perfil.usos.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Armário</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Tarifação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfil.usos.map((uso) => (
                    <TableRow key={uso.id}>
                      <TableCell className="font-medium">
                        #{uso.armario.numero} · {uso.armario.bloco} (
                        {uso.armario.tamanho})
                      </TableCell>
                      <TableCell>{formatarDataHora(uso.checkIn)}</TableCell>
                      <TableCell>
                        {uso.checkOut
                          ? formatarDataHora(uso.checkOut)
                          : "Em andamento"}
                      </TableCell>
                      <TableCell>
                        {uso.valorCobrado && uso.valorCobrado > 0
                          ? `R$ ${uso.valorCobrado.toFixed(2)} (${uso.statusPagamento})`
                          : "Isento (Franquia)"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum uso registrado até o momento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
