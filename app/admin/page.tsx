import { prisma } from '@/lib/prisma'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalOrders,
    paidOrders,
    monthOrders,
    lastMonthOrders,
    totalCustomers,
    recentOrders,
    topProducts,
    webhookLogs,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.webhookLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Gráfico dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const chartData = await Promise.all(
    last7Days.map(async (date) => {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)

      const agg = await prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: start, lte: end } },
        _sum: { totalAmount: true },
        _count: true,
      })

      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        receita: agg._sum.totalAmount || 0,
        pedidos: agg._count,
      }
    })
  )

  const currentRevenue = monthOrders._sum.totalAmount || 0
  const lastRevenue = lastMonthOrders._sum.totalAmount || 0
  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0

  return {
    kpis: {
      totalRevenue: paidOrders._sum.totalAmount || 0,
      monthRevenue: currentRevenue,
      revenueGrowth,
      totalOrders,
      paidOrdersCount: paidOrders._count,
      monthOrdersCount: monthOrders._count,
      totalCustomers,
    },
    chartData,
    recentOrders,
    topProducts,
    webhookLogs,
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()
  return <AdminDashboardClient data={data} />
}
