import { NextAuthOptions } from 'next-auth'
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Adapter customizado para NextAuth v4 + Prisma
 *
 * Motivo: @auth/prisma-adapter v2 foi escrito para Auth.js v5 e tem bugs
 * com NextAuth v4:
 *  - updateUser não usa { data: ... } corretamente
 *  - createUser não trata name: null (campo NOT NULL no schema)
 *  - linkAccount pode falhar silenciosamente
 *
 * Essa implementação resolve todos esses problemas.
 */
function CustomPrismaAdapter(): Adapter {
  return {
    // ── Usuários ──────────────────────────────────────────────────────────────
    async createUser(data: Omit<AdapterUser, 'id'>) {
      const user = await prisma.user.create({
        data: {
          id:            randomUUID(),
          name:          data.name ?? data.email?.split('@')[0] ?? 'Usuário', // garante NOT NULL
          email:         data.email!,
          emailVerified: data.emailVerified ?? null,
          avatar:        (data as any).image ?? null,
          password:      null,
        },
      })
      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        image:         user.avatar,
      }
    },

    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return null
      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        image:         user.avatar,
        role:          user.role,
      } as any
    },

    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return null
      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        image:         user.avatar,
        role:          user.role,
      } as any
    },

    async getUserByAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      })
      if (!account?.user) return null
      const user = account.user
      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        image:         user.avatar,
        role:          user.role,
      } as any
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          ...(data.name          != null ? { name: data.name }                   : {}),
          ...(data.email         != null ? { email: data.email }                 : {}),
          ...(data.emailVerified != null ? { emailVerified: data.emailVerified } : {}),
          ...((data as any).image != null ? { avatar: (data as any).image }      : {}),
        },
      })
      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        emailVerified: user.emailVerified,
        image:         user.avatar,
      }
    },

    async deleteUser(id: string) {
      await prisma.user.delete({ where: { id } })
    },

    // ── Accounts (OAuth links) ────────────────────────────────────────────────
    async linkAccount(data: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId:            data.userId,
          type:              data.type,
          provider:          data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token:     data.refresh_token ?? null,
          access_token:      data.access_token  ?? null,
          expires_at:        data.expires_at    ?? null,
          token_type:        data.token_type    ?? null,
          scope:             data.scope         ?? null,
          id_token:          data.id_token      ?? null,
          session_state:     (data.session_state as string | null) ?? null,
        },
      })
      return data
    },

    async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      })
    },

    // ── Sessions ──────────────────────────────────────────────────────────────
    async createSession(data: AdapterSession) {
      return prisma.session.create({ data })
    },

    async getSessionAndUser(sessionToken: string) {
      const result = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })
      if (!result) return null
      const { user, ...session } = result
      return {
        session,
        user: {
          id:            user.id,
          name:          user.name,
          email:         user.email,
          emailVerified: user.emailVerified,
          image:         user.avatar,
          role:          user.role,
        } as any,
      }
    },

    async updateSession(data: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>) {
      return prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      })
    },

    async deleteSession(sessionToken: string) {
      await prisma.session.delete({ where: { sessionToken } }).catch(() => {})
    },

    // ── Verification tokens ───────────────────────────────────────────────────
    async createVerificationToken(data: VerificationToken) {
      return prisma.verificationToken.create({ data })
    },

    async useVerificationToken({ identifier, token }: Pick<VerificationToken, 'identifier' | 'token'>) {
      return prisma.verificationToken
        .delete({ where: { identifier_token: { identifier, token } } })
        .catch(() => null)
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  pages: {
    signIn: '/auth/login',
    error:  '/auth/error',
  },

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID  ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt:        'consent',
          access_type:   'offline',
          response_type: 'code',
        },
      },
    }),

    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID     ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha obrigatórios')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.password) {
          throw new Error('Usuário não encontrado')
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Senha incorreta')
        }
        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          image: user.avatar,
          role:  user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Primeiro login: popula token com dados do usuário
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
      }

      // Login OAuth: garante role do banco
      if (account && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where:  { email: user.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id   = dbUser.id
            token.role = dbUser.role
          }
        } catch (err) {
          console.error('[NextAuth JWT] Erro ao buscar usuário:', err)
        }
      }

      // Renovação do token: busca role atualizada se necessário
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where:  { email: token.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id   = dbUser.id
            token.role = dbUser.role
          }
        } catch {}
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Anti-loop: nunca redirecionar de volta para login/error após autenticar
      if (url.includes('/auth/login') || url.includes('/auth/error')) {
        return baseUrl
      }
      if (url.startsWith('/'))                                      return `${baseUrl}${url}`
      if (new URL(url).origin === new URL(baseUrl).origin)          return url
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account }) {
      // Atualiza avatar ao fazer login social
      if (
        (account?.provider === 'google' || account?.provider === 'discord') &&
        user.email
      ) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data:  {
              avatar: user.image  ?? undefined,
              name:   user.name   ?? undefined,
            },
          })
        } catch {
          // não crítico
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
