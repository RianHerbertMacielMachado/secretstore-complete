import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

// GET — lista todos os itens do carrossel (admin)
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const items = await prisma.carouselItem.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — cria novo item no carrossel
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const { name, image, link, sortOrder, isActive } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!image?.trim()) return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 })
    if (!link?.trim()) return NextResponse.json({ error: 'Link é obrigatório' }, { status: 400 })

    const item = await prisma.carouselItem.create({
      data: {
        name: name.trim(),
        image: image.trim(),
        link: link.trim(),
        sortOrder: sortOrder ?? 0,
        isActive: isActive !== false,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
