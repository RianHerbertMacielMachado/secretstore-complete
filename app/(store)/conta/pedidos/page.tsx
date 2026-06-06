import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import StoreLayout from '@/components/layouts/StoreLayout'
import ContaClient from '@/components/store/ContaClient'

export const metadata = { title: 'Meus Pedidos | DarkShop' }

export default async function MeusPedidosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login?callbackUrl=/conta/pedidos')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      orders: {
        include: { items: { include: { product: { select: { name: true, mainImage: true, slug: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) redirect('/auth/login')

  return (
    <StoreLayout>
      <ContaClient
        user={{ id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt, googleId: user.googleId, discordId: user.discordId }}
        orders={user.orders.map((o) => ({
          id: o.id,
          totalAmount: o.totalAmount,
          paymentStatus: o.paymentStatus,
          deliveryStatus: o.deliveryStatus,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt,
          items: o.items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price, product: i.product })),
        }))}
        defaultTab="pedidos"
      />
    </StoreLayout>
  )
}
