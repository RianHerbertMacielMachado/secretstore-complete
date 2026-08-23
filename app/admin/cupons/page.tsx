import { prisma } from '@/lib/prisma'
import AdminCuponsClient from '@/components/admin/AdminCuponsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCuponsPage() {
  const [coupons, categories, subCategories, products] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.subCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        subCategoryId: true,
        subCategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ])

  return (
    <AdminCuponsClient
      coupons={coupons.map((c) => ({
        ...c,
        categoryIds: JSON.parse(c.categoryIds || '[]'),
        subCategoryIds: JSON.parse(c.subCategoryIds || '[]'),
        productIds: JSON.parse(c.productIds || '[]'),
      }))}
      categories={categories}
      subCategories={subCategories}
      products={products}
    />
  )
}
