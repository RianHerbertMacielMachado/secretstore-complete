import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get('category')
    const subCategorySlug = searchParams.get('subCategory')
    const featured = searchParams.get('featured')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const where: any = { status: 'ACTIVE' }

    if (categorySlug) {
      where.subCategory = { category: { slug: categorySlug } }
    }
    if (subCategorySlug) {
      where.subCategory = { slug: subCategorySlug }
    }
    if (featured === 'true') where.featured = true

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          subCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          productImages: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        images: p.productImages.map((img) => img.url),
        category: p.subCategory.category,
        subCategory: { id: p.subCategory.id, name: p.subCategory.name, slug: p.subCategory.slug },
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[PRODUCTS GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}
