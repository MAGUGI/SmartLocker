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
  { href: "/armarios", label: "Armários" },
  { href: "/meu-armario", label: "Meu armário" },
  { href: "/perfil", label: "Perfil" },
];

export function AppNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const iniciais = (user?.name ?? "AL")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex min-h-14 max-w-4xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <BrandMark />
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={mesclarClasses(
                "rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3",
                pathname.startsWith(link.href) &&
                  "bg-primary/10 text-primary hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
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
                    {user?.name ?? "Aluno"}
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
                  Meu Perfil e LGPD
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
