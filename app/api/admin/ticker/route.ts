import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

// GET — retorna itens do ticker + configurações globais
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const [items, configs] = await Promise.all([
      prisma.tickerItem.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.siteConfig.findMany({
        where: { key: { in: ['ticker_enabled', 'ticker_speed', 'ticker_color'] } },
      }),
    ])
    const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return NextResponse.json({
      items,
      settings: {
        enabled: settings.ticker_enabled === 'true',
        speed: settings.ticker_speed || 'medium',
        color: settings.ticker_color || '#ffffff',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — cria novo item de ticker OU atualiza configurações globais
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()

    // Se contiver chave "settings", é atualização de configurações globais
    if (body.settings) {
      const { enabled, speed, color } = body.settings
      const upserts = [
        { key: 'ticker_enabled', value: String(enabled ?? false) },
        { key: 'ticker_speed', value: speed || 'medium' },
        { key: 'ticker_color', value: color || '#ffffff' },
      ]
      await Promise.all(
        upserts.map((cfg) =>
          prisma.siteConfig.upsert({
            where: { key: cfg.key },
            create: { key: cfg.key, value: cfg.value },
            update: { value: cfg.value },
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    // Caso contrário, cria novo item de texto no ticker
    const { text, sortOrder, isActive } = body
    if (!text?.trim()) return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 })

    const item = await prisma.tickerItem.create({
      data: {
        text: text.trim(),
        sortOrder: sortOrder ?? 0,
        isActive: isActive !== false,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
