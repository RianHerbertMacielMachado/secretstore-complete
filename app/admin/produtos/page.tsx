import { prisma } from '@/lib/prisma'
import AdminProdutosClient from '@/components/admin/AdminProdutosClient'

export const dynamic = 'force-dynamic'

export default async function AdminProdutosPage() {
  const [products, subCategories] = await Promise.all([
    prisma.product.findMany({
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subCategory.findMany({
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
  ])

  return (
    <AdminProdutosClient
      products={products.map(p => ({
        ...p,
        images: p.productImages.map((img) => img.url),
      }))}
      subCategories={subCategories}
    />
  )
}
