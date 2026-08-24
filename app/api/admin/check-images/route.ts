import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Pega amostra de 20 produtos
  const products = await prisma.product.findMany({
    take: 20,
    select: { id: true, slug: true, mainImage: true },
    orderBy: { updatedAt: 'desc' },
  })

  // Conta todos do banco
  const [totalProducts, totalImages] = await Promise.all([
    prisma.product.count(),
    prisma.productImage.count(),
  ])

  // Classifica cada mainImage
  const classify = (url: string | null) => {
    if (!url || url === '') return 'vazio'
    if (url.startsWith('data:image/')) return 'base64'
    if (url.startsWith('https://res.cloudinary.com')) return 'cloudinary'
    return `outro: ${url.slice(0, 60)}`
  }

  // Conta quantos mainImage são base64 vs cloudinary no banco inteiro
  const allMainImages = await prisma.product.findMany({
    select: { mainImage: true },
  })
  const allProductImages = await prisma.productImage.findMany({
    select: { url: true },
  })

  const mainStats = { base64: 0, cloudinary: 0, vazio: 0, outro: 0 }
  for (const p of allMainImages) {
    const t = classify(p.mainImage)
    if (t === 'base64') mainStats.base64++
    else if (t === 'cloudinary') mainStats.cloudinary++
    else if (t === 'vazio') mainStats.vazio++
    else mainStats.outro++
  }

  const imgStats = { base64: 0, cloudinary: 0, vazio: 0, outro: 0 }
  for (const i of allProductImages) {
    const t = classify(i.url)
    if (t === 'base64') imgStats.base64++
    else if (t === 'cloudinary') imgStats.cloudinary++
    else if (t === 'vazio') imgStats.vazio++
    else imgStats.outro++
  }

  return NextResponse.json({
    totais: {
      produtos: totalProducts,
      productImages: totalImages,
    },
    mainImage: mainStats,
    productImages: imgStats,
    amostra_20_mais_recentes: products.map((p) => ({
      slug: p.slug,
      tipo: classify(p.mainImage),
      url_preview: p.mainImage?.slice(0, 80) ?? '(vazio)',
    })),
  }, { status: 200 })
}
