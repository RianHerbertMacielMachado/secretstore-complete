import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProductDetailClient from '@/components/store/ProductDetailClient'

interface Props {
  params: { slug: string }
}

export const dynamicParams = true

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

  return {
    title: `${product.name} | SecretStore`,
    description: product.description.slice(0, 160),
    keywords: [product.name, product.subCategory.name, product.subCategory.category.name, 'produto digital'],
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [{ url: product.mainImage, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
      images: [product.mainImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
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
        images: product.productImages.map((img) => img.url),
      }}
      related={related.map((r) => ({
        ...r,
        images: r.productImages.map((img) => img.url),
      }))}
    />
  )
}
