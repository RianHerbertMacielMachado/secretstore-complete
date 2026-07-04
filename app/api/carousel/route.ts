import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET público — retorna itens ativos do carrossel para o frontend
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await prisma.carouselItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, image: true, link: true, sortOrder: true },
    })
    return NextResponse.json({ items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
