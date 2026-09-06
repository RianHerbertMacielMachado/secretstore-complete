import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Garante que NEXTAUTH_URL sempre aponta para o domínio real em produção.
// Se não estiver configurado, deriva do NEXT_PUBLIC_SITE_URL.
// Isso resolve o loop de login OAuth (Discord/Google) causado por callback URL inválido.
function getNextAuthUrl(): string {
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('sandbox')) {
    return process.env.NEXTAUTH_URL
  }
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('sandbox')) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // fallback: deixa o NextAuth detectar automaticamente pelo header da requisição
  return ''
}

const resolvedUrl = getNextAuthUrl()
if (resolvedUrl) {
  process.env.NEXTAUTH_URL = resolvedUrl
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  // trustHost: aceita qualquer host de origem — essencial para proxies/Railway/Vercel/Cloudflare
  // Cast necessário pois NextAuthOptions v4 não tipifica trustHost mas aceita em runtime
  ...(({ trustHost: true }) as any),

  session: {
    strategy: 'jwt',
    // Aumenta vida do token para evitar expiração silenciosa que causa re-login
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
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
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Bloqueia login OAuth se as credenciais do provider não estiverem configuradas
      if (account?.provider === 'google') {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
          console.error('[NextAuth] Google OAuth não configurado')
          return '/auth/login?error=OAuthNotConfigured'
        }
      }
      if (account?.provider === 'discord') {
        if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
          console.error('[NextAuth] Discord OAuth não configurado')
          return '/auth/login?error=OAuthNotConfigured'
        }
      }
      return true
    },

    async jwt({ token, user, account }) {
      // Na criação do token (primeiro login)
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }

      // Para login social, busca o role do banco
      if (account && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
          }
        } catch (err) {
          console.error('[NextAuth JWT] Erro ao buscar usuário:', err)
        }
      }

      // Se ainda não tem role, busca no banco pelo email
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
          }
        } catch (err) {
          console.error('[NextAuth JWT] Erro ao buscar role:', err)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Evita loops: se a URL de destino for a página de login, manda para home
      if (url.includes('/auth/login') || url.includes('/auth/error')) {
        return baseUrl
      }
      // Permite redirecionamentos relativos
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Permite redirecionamentos para o mesmo domínio
      if (new URL(url).origin === new URL(baseUrl).origin) {
        return url
      }
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account }) {
      // Atualizar avatar e dados do provider social
      if (account?.provider === 'google' || account?.provider === 'discord') {
        try {
          await prisma.user.update({
            where: { email: user.email! },
            data: {
              avatar: user.image ?? undefined,
              name: user.name ?? undefined,
            },
          })
        } catch (err) {
          // Ignora erros não críticos de atualização de perfil
          console.warn('[NextAuth] Falha ao atualizar avatar:', err)
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
