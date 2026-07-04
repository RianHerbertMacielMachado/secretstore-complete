import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [images, config] = await Promise.all([
      prisma.heroBg.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, image: true },
      }),
      prisma.siteConfig.findUnique({ where: { key: 'hero_interval' } }),
    ])
    return NextResponse.json({
      images,
      interval: parseInt(config?.value || '5', 10),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
