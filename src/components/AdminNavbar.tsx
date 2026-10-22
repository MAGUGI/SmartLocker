"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { mesclarClasses } from "@/utils/mesclarClasses";

const LINKS = [
  { href: "/dashboard", label: "Ocupação", exact: true },
  { href: "/dashboard/armarios", label: "Armários" },
  { href: "/dashboard/manutencao", label: "Manutenção (OS)" },
  { href: "/dashboard/inspecoes", label: "Inspeções" },
  { href: "/dashboard/usuarios", label: "Usuários" },
  { href: "/dashboard/auditoria", label: "Auditoria" },
  { href: "/dashboard/historico", label: "Histórico" },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const iniciais = (user?.name ?? "AD")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <BrandMark suffix="· admin" />
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          {LINKS.map((link) => {
            const ativo = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={mesclarClasses(
                  "rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-2.5 sm:text-sm",
                  ativo && "bg-primary/10 text-primary hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs font-semibold">
                    {iniciais}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Menu da conta</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name ?? "Administrador"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="flex items-center gap-2">
                  <UserCircle2 className="size-4" aria-hidden="true" />
                  Configurações de Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
