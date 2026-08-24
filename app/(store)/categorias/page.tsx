import { prisma } from '@/lib/prisma'
import CategoriasClient from '@/components/store/CategoriasClient'

// Revalida a cada 120 segundos — lista de categorias muda raramente
export const revalidate = 120

export const metadata = {
  title: 'Categorias | SecretStore',
  description: 'Explore nossas categorias de produtos digitais',
}

export default async function CategoriasPage() {
  let categoriesWithCount: any[] = []

  try {
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

    categoriesWithCount = categories.map((cat) => ({
      ...cat,
      _count: {
        products: cat.subCategories.reduce((sum, sub) => sum + sub._count.products, 0),
      },
    }))
  } catch (err: any) {
    console.error('[CategoriasPage] erro Prisma:', err?.message ?? err)
  }

  return <CategoriasClient categories={categoriesWithCount} />
}
