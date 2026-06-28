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
    include: {
      subCategory: {
        select: {
          id: true,
          name: true,
          category: { select: { id: true, name: true } },
        },
      },
      productImages: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      images: p.productImages.map((img) => img.url),
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const {
      name, description, price, salePrice, mainImage,
      subCategoryId, driveLink, driveDeliveryMethod, status, featured,
      images, youtubeUrl,
    } = body

    const slug = slugify(body.slug || name)

    const product = await prisma.product.create({
      data: {
        name, slug, description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        mainImage: mainImage || '',
        youtubeUrl: youtubeUrl || null,
        subCategoryId,
        driveLink: driveLink || '',
        driveDeliveryMethod: driveDeliveryMethod || 'LINK',
        status: status || 'ACTIVE',
        featured: featured || false,
        productImages: {
          create: (images as string[] || [])
            .filter(Boolean)
            .map((url: string, idx: number) => ({ url, order: idx })),
        },
      },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({
      product: {
        ...product,
        images: product.productImages.map((img) => img.url),
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar produto' }, { status: 500 })
  }
}
