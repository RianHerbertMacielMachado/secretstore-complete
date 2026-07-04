import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminFaixaClient from '@/components/admin/AdminFaixaClient'

export default async function AdminFaixaPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/signin')

  const [items, configs] = await Promise.all([
    prisma.tickerItem.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.siteConfig.findMany({
      where: { key: { in: ['ticker_enabled', 'ticker_speed', 'ticker_color'] } },
    }),
  ])

  const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  return (
    <AdminFaixaClient
      items={items}
      settings={{
        enabled: settings.ticker_enabled === 'true',
        speed: settings.ticker_speed || 'medium',
        color: settings.ticker_color || '#ffffff',
      }}
    />
  )
}
