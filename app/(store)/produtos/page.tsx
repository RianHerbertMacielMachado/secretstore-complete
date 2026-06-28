import { prisma } from '@/lib/prisma'
import ProdutosClient from '@/components/store/ProdutosClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Produtos | SecretStore',
  description: 'Explore nossa coleção de produtos digitais exclusivos',
}

interface Props {
  searchParams: { categoria?: string; busca?: string; ordem?: string }
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { categoria, busca, ordem } = searchParams

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(categoria ? { subCategory: { category: { slug: categoria } } } : {}),
        ...(busca
          ? {
              OR: [
                { name: { contains: busca, mode: 'insensitive' } },
                { description: { contains: busca, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        subCategory: {
          include: { category: true },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
      orderBy:
        ordem === 'preco-asc'
          ? { price: 'asc' }
          : ordem === 'preco-desc'
          ? { price: 'desc' }
          : ordem === 'nome'
          ? { name: 'asc' }
          : { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  return (
    <ProdutosClient
      products={products.map((p) => ({
        ...p,
        images: p.productImages.map((img) => img.url),
        category: p.subCategory.category,
      }))}
      categories={categories}
      activeCategory={categoria || ''}
      searchQuery={busca || ''}
      sortOrder={ordem || 'recentes'}
    />
  )
}
