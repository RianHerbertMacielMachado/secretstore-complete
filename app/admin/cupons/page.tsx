import { prisma } from '@/lib/prisma'
import AdminCuponsClient from '@/components/admin/AdminCuponsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCuponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <AdminCuponsClient
      coupons={coupons.map(c => ({
        ...c,
        categoryIds: JSON.parse(c.categoryIds || '[]'),
        productIds: JSON.parse(c.productIds || '[]'),
      }))}
    />
  )
}
