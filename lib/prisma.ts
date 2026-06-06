import { PrismaClient } from '@prisma/client'

// ─── Turso / libSQL em produção (Vercel) ────────────────────────────────────
// Em desenvolvimento local continua usando SQLite via DATABASE_URL normal.
// Em produção, se TURSO_DATABASE_URL estiver definido, usa o adapter libSQL.
// ────────────────────────────────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const isTurso = !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN

  if (isTurso) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })

    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      log: ['error'],
    } as ConstructorParameters<typeof PrismaClient>[0])
  }

  // Desenvolvimento local — SQLite via DATABASE_URL
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
