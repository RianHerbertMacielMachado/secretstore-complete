import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils/helpers'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const subCategory = await prisma.subCategory.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug: body.slug ? slugify(body.slug) : undefined,
        description: body.description ?? null,
        image: body.image ?? null,
        isVisible: body.isVisible,
        sortOrder: body.sortOrder,
        categoryId: body.categoryId,
      },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    })
    return NextResponse.json({ subCategory })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    await prisma.subCategory.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
