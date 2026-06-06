import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProdutosClient from '@/components/store/ProdutosClient'

interface Props {
  params: { slug: string }
}

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      select: { slug: true },
    })
    return categories.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export default async function CategoriaSlugPage({ params }: Props) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!category || !category.isVisible) notFound()

  const allCategories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <>
      <ProdutosClient
        products={category.products.map((p) => ({ ...p, images: JSON.parse(p.images || '[]') }))}
        categories={allCategories}
        activeCategory={params.slug}
        searchQuery=""
        sortOrder="recentes"
      />
    </>
  )
}
