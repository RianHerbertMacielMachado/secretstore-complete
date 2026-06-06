import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils/helpers'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: slugify(body.slug || body.name),
        description: body.description || null,
        image: body.image || null,
        isVisible: body.isVisible ?? true,
        sortOrder: body.sortOrder || 0,
      },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
