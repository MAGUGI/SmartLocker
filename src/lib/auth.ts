import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/schemas/auth";
import { verificarLimiteDeTaxa } from "@/server/limiteDeTaxaService";
import { extrairPrimeiroIp } from "@/utils/extrairPrimeiroIp";

const TAMANHO_MINIMO_SEGREDO = 32;
const LIMITE_TENTATIVAS_LOGIN = 5;
const JANELA_LOGIN_SEGUNDOS = 60;

export function validarSegredoDeSessao() {
  if (
    !process.env.NEXTAUTH_SECRET ||
    process.env.NEXTAUTH_SECRET.length < TAMANHO_MINIMO_SEGREDO
  ) {
    throw new Error(
      "NEXTAUTH_SECRET precisa estar definido com pelo menos 32 caracteres"
    );
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        validarSegredoDeSessao();

        const ip = extrairPrimeiroIp(req?.headers?.["x-forwarded-for"]);
        const podeTentar = await verificarLimiteDeTaxa(
          `login:${ip}`,
          LIMITE_TENTATIVAS_LOGIN,
          JANELA_LOGIN_SEGUNDOS
        );
        if (!podeTentar) return null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || user.bloqueado || user.anonimizado) {
          return null;
        }

        const senhaValida = await bcrypt.compare(
          parsed.data.senha,
          user.passwordHash
        );
        if (!senhaValida) return null;

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          matricula: user.matricula,
          unidadeId: user.unidadeId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.matricula = user.matricula;
        token.unidadeId = user.unidadeId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.matricula = token.matricula;
      session.user.unidadeId = token.unidadeId;
      return session;
    },
  },
};
