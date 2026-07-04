import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminCarrosselClient from '@/components/admin/AdminCarrosselClient'

export default async function AdminCarrosselPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') redirect('/auth/signin')

  const items = await prisma.carouselItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return <AdminCarrosselClient items={items} />
}
