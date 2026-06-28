import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      ...product,
      images: product.productImages.map((img) => img.url),
      category: product.subCategory.category,
    })
  } catch (error) {
    console.error('[PRODUCT SLUG]', error)
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}
