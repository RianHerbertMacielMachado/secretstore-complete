import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

// GET — lista imagens + configuração do intervalo
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const [images, config] = await Promise.all([
      prisma.heroBg.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.siteConfig.findUnique({ where: { key: 'hero_interval' } }),
    ])
    return NextResponse.json({ images, interval: config?.value || '5' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — adiciona nova imagem OU salva intervalo
export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()

    // Salvar intervalo
    if (body.interval !== undefined) {
      await prisma.siteConfig.upsert({
        where: { key: 'hero_interval' },
        create: { key: 'hero_interval', value: String(body.interval) },
        update: { value: String(body.interval) },
      })
      return NextResponse.json({ success: true })
    }

    // Adicionar imagem
    if (!body.image?.trim()) return NextResponse.json({ error: 'Imagem obrigatória' }, { status: 400 })
    const image = await prisma.heroBg.create({
      data: {
        image: body.image.trim(),
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive !== false,
      },
    })
    return NextResponse.json({ image }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
