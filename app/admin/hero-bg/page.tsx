import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeroBgClient from '@/components/admin/AdminHeroBgClient'

export default async function AdminHeroBgPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/signin')

  const [images, config] = await Promise.all([
    prisma.heroBg.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.siteConfig.findUnique({ where: { key: 'hero_interval' } }),
  ])

  return (
    <AdminHeroBgClient
      images={images}
      interval={parseInt(config?.value || '5', 10)}
    />
  )
}
