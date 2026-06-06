import { prisma } from '@/lib/prisma'
import AdminCategoriasClient from '@/components/admin/AdminCategoriasClient'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  return <AdminCategoriasClient categories={categories} />
}
