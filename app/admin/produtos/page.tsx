import { prisma } from '@/lib/prisma'
import AdminProdutosClient from '@/components/admin/AdminProdutosClient'

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <AdminProdutosClient
      products={products.map(p => ({ ...p, images: JSON.parse(p.images || '[]') }))}
      categories={categories}
    />
  )
}
