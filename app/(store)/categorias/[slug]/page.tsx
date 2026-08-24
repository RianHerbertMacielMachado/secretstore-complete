import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProdutosClient from '@/components/store/ProdutosClient'
import SubCategoriasClient from '@/components/store/SubCategoriasClient'

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
      subCategories: {
        where: { isVisible: true },
        include: {
          _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!category || !category.isVisible) notFound()

  return (
    <SubCategoriasClient
      category={{ id: category.id, name: category.name, slug: category.slug, description: category.description }}
      subCategories={category.subCategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        image: sub.image,
        isVisible: sub.isVisible,
        _count: sub._count,
      }))}
    />
  )
}
