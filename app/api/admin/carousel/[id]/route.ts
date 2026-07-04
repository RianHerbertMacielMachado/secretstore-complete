import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

// PUT — atualiza item do carrossel
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const { name, image, link, sortOrder, isActive } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!image?.trim()) return NextResponse.json({ error: 'Imagem é obrigatória' }, { status: 400 })
    if (!link?.trim()) return NextResponse.json({ error: 'Link é obrigatório' }, { status: 400 })

    const item = await prisma.carouselItem.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        image: image.trim(),
        link: link.trim(),
        sortOrder: sortOrder ?? 0,
        isActive: isActive !== false,
      },
    })
    return NextResponse.json({ item })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — remove item do carrossel
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    await prisma.carouselItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
