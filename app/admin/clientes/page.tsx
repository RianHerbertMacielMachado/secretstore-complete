import { prisma } from '@/lib/prisma'
import AdminClientesClient from '@/components/admin/AdminClientesClient'

export const dynamic = 'force-dynamic'

export default async function AdminClientesPage() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { paymentStatus: 'PAID' },
        select: { totalAmount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const customersWithStats = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    avatar: c.avatar,
    createdAt: c.createdAt,
    totalOrders: c._count.orders,
    totalSpent: c.orders.reduce((acc, o) => acc + o.totalAmount, 0),
    googleId: c.googleId,
    discordId: c.discordId,
  }))

  return <AdminClientesClient customers={customersWithStats} />
}
