import { prisma } from '@/lib/prisma'
import StoreLayout from '@/components/layouts/StoreLayout'
import CategoriasClient from '@/components/store/CategoriasClient'

export const metadata = {
  title: 'Categorias | DarkShop',
  description: 'Explore nossas categorias de produtos digitais',
}

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    include: {
      _count: { select: { products: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <StoreLayout>
      <CategoriasClient categories={categories} />
    </StoreLayout>
  )
}
