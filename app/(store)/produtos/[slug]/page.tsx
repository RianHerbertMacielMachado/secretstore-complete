import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProductDetailClient from '@/components/store/ProductDetailClient'

interface Props {
  params: { slug: string }
}

export const dynamicParams = true

// Remove null bytes (U+0000) — digest 402100154
function s(v: string | null | undefined): string {
  return (v ?? '').replace(/\u0000/g, '')
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true },
    })
    return products.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    })

    if (!product) return { title: 'Produto não encontrado' }

    const name = s(product.name)
    const desc = s(product.description).slice(0, 160)
    const image = s(product.mainImage)

    return {
      title: `${name} | SecretStore`,
      description: desc,
      keywords: [name, product.subCategory.name, product.subCategory.category.name, 'produto digital'],
      openGraph: {
        title: name,
        description: desc,
        images: [{ url: image, alt: name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: name,
        description: desc,
        images: [image],
      },
    }
  } catch {
    return { title: 'Produto' }
  }
}

export default async function ProductPage({ params }: Props) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        subCategory: {
          include: { category: true },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    if (!product) notFound()

    // Related products: same subCategory
    const related = await prisma.product.findMany({
      where: {
        subCategoryId: product.subCategoryId,
        status: 'ACTIVE',
        id: { not: product.id },
      },
      take: 4,
      include: {
        subCategory: {
          include: { category: true },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    return (
      <ProductDetailClient
        product={{
          ...product,
          name: s(product.name),
          slug: s(product.slug),
          description: s(product.description),
          mainImage: s(product.mainImage),
          images: product.productImages.map((img) => s(img.url)),
        }}
        related={related.map((r) => ({
          ...r,
          name: s(r.name),
          slug: s(r.slug),
          description: s(r.description),
          mainImage: s(r.mainImage),
          images: r.productImages.map((img) => s(img.url)),
        }))}
      />
    )
  } catch (err: any) {
    console.error('[ProductPage] erro Prisma:', err?.message ?? err)
    notFound()
  }
}
