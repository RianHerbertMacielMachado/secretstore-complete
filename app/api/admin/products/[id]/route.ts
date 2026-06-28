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
    const { images, ...rest } = body

    // Update product fields
    await prisma.product.update({
      where: { id: params.id },
      data: {
        name: rest.name,
        slug: rest.slug ? slugify(rest.slug) : undefined,
        description: rest.description,
        price: parseFloat(rest.price),
        salePrice: rest.salePrice ? parseFloat(rest.salePrice) : null,
        mainImage: rest.mainImage,
        youtubeUrl: rest.youtubeUrl || null,
        subCategoryId: rest.subCategoryId,
        driveLink: rest.driveLink,
        driveDeliveryMethod: rest.driveDeliveryMethod,
        status: rest.status,
        featured: rest.featured,
      },
    })

    // Replace all product images
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: params.id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images
            .filter(Boolean)
            .map((url: string, idx: number) => ({
              url,
              order: idx,
              productId: params.id,
            })),
        })
      }
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
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
        images: product?.productImages.map((img) => img.url) ?? [],
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
