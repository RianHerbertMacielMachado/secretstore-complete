import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils/helpers'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') return false
  return true
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ products: products.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })) })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const { name, description, price, salePrice, mainImage, categoryId, driveLink, driveDeliveryMethod, status, featured, images } = body

    const slug = slugify(body.slug || name)
    const product = await prisma.product.create({
      data: {
        name, slug, description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        mainImage: mainImage || '',
        images: JSON.stringify(images || []),
        categoryId,
        driveLink: driveLink || '',
        driveDeliveryMethod: driveDeliveryMethod || 'LINK',
        status: status || 'ACTIVE',
        featured: featured || false,
      },
      include: { category: { select: { name: true } } },
    })
    return NextResponse.json({ product: { ...product, images: JSON.parse(product.images) } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar produto' }, { status: 500 })
  }
}
