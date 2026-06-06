import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/store/ProductDetailClient'
import StoreLayout from '@/components/layouts/StoreLayout'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  })
  return products.map((p) => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
    include: { category: true },
  })

  if (!product) notFound()

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: 'ACTIVE', id: { not: product.id } },
    take: 4,
    include: { category: true },
  })

  return (
    <StoreLayout>
      <ProductDetailClient
        product={{ ...product, images: JSON.parse(product.images || '[]') }}
        related={related.map(r => ({ ...r, images: JSON.parse(r.images || '[]') }))}
      />
    </StoreLayout>
  )
}
