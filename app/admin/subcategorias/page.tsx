import { prisma } from '@/lib/prisma'
import AdminSubCategoriasClient from '@/components/admin/AdminSubCategoriasClient'

export const dynamic = 'force-dynamic'

export default async function AdminSubCategoriasPage() {
  const [subCategories, categories] = await Promise.all([
    prisma.subCategory.findMany({
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <AdminSubCategoriasClient
      subCategories={subCategories}
      categories={categories}
    />
  )
}
