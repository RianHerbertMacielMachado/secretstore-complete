import { prisma } from '@/lib/prisma'
import AdminPedidosClient from '@/components/admin/AdminPedidosClient'

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, mainImage: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return <AdminPedidosClient orders={orders} />
}
