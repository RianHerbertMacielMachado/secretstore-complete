import { prisma } from '@/lib/prisma'
import CategoriasClient from '@/components/store/CategoriasClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categorias | SecretStore',
  description: 'Explore nossas categorias de produtos digitais',
}

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    include: {
      subCategories: {
        where: { isVisible: true },
        include: {
          _count: {
            select: { products: { where: { status: 'ACTIVE' } } },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Compute product count per category (sum of all subcategories)
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    _count: {
      products: cat.subCategories.reduce((sum, sub) => sum + sub._count.products, 0),
    },
  }))

  return <CategoriasClient categories={categoriesWithCount} />
}
