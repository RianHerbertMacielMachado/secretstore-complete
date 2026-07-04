import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET público — retorna itens e configurações do ticker para o frontend
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [items, configs] = await Promise.all([
      prisma.tickerItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, text: true },
      }),
      prisma.siteConfig.findMany({
        where: { key: { in: ['ticker_enabled', 'ticker_speed', 'ticker_color'] } },
      }),
    ])
    const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return NextResponse.json({
      items,
      enabled: settings.ticker_enabled === 'true',
      speed: settings.ticker_speed || 'medium',
      color: settings.ticker_color || '#ffffff',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
