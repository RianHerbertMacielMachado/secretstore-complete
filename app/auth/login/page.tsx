import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  let storeName = 'DarkShop'
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: ['store_name', 'site_name'] } },
    })
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    storeName = map.store_name || map.site_name || 'DarkShop'
  } catch {
    // usa padrão se banco indisponível
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm storeName={storeName} />
    </Suspense>
  )
}
