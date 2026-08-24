import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    // Testa query mínima — só conta
    const count = await prisma.product.count({ where: { status: 'ACTIVE' } })

    // Testa buscar 1 produto com include completo
    let sampleError: string | null = null
    let sampleProduct: any = null
    try {
      sampleProduct = await prisma.product.findFirst({
        where: { status: 'ACTIVE' },
        include: {
          subCategory: { include: { category: true } },
          productImages: { orderBy: { order: 'asc' } },
        },
      })
    } catch (e: any) {
      sampleError = e?.message ?? String(e)
    }

    // Testa buscar sem productImages
    let sampleNoImagesError: string | null = null
    let sampleNoImages: any = null
    try {
      sampleNoImages = await prisma.product.findFirst({
        where: { status: 'ACTIVE' },
        select: {
          id: true, name: true, slug: true, mainImage: true, status: true,
        },
      })
    } catch (e: any) {
      sampleNoImagesError = e?.message ?? String(e)
    }

    return NextResponse.json({
      activeProductCount: count,
      withInclude: {
        error: sampleError,
        productId: sampleProduct?.id ?? null,
        productName: sampleProduct?.name ?? null,
        mainImageType: sampleProduct?.mainImage
          ? (sampleProduct.mainImage.startsWith('data:') ? 'base64' :
             sampleProduct.mainImage.startsWith('https://res.cloudinary.com') ? 'cloudinary' : 'other_url')
          : 'empty',
        productImagesCount: sampleProduct?.productImages?.length ?? 0,
      },
      withoutImages: {
        error: sampleNoImagesError,
        productId: sampleNoImages?.id ?? null,
        productName: sampleNoImages?.name ?? null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ fatalError: err?.message ?? String(err) }, { status: 500 })
  }
}
