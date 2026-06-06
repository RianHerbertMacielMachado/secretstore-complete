import { prisma } from '@/lib/prisma'
import AdminLayoutsClient from '@/components/admin/AdminLayoutsClient'

export const dynamic = 'force-dynamic'

export default async function AdminLayoutsPage() {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'active_layout' } })
  const activeLayout = config?.value || 'dark-grunge'
  return <AdminLayoutsClient activeLayout={activeLayout} />
}
