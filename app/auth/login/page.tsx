import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: ['store_name', 'site_name'] } },
  })
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const storeName = map.store_name || map.site_name || 'DarkShop'

  return <LoginForm storeName={storeName} />
}
