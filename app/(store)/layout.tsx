import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import LayoutThemeApplier from '@/components/layouts/LayoutThemeApplier'
import StoreLayout from '@/components/layouts/StoreLayout'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: ['store_name', 'site_name', 'site_description'] } },
  })
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const name = map.store_name || map.site_name || 'DarkShop'
  const desc = map.site_description || 'Sua loja de produtos digitais com estética gótica e e-girl'

  return {
    title: `${name} — Produtos Digitais Premium`,
    description: desc,
  }
}

export default async function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  // Busca todos os configs necessários e as configurações da loja de uma vez
  const [configs, storeSettings] = await Promise.all([
    prisma.siteConfig.findMany({
      where: {
        key: { in: ['active_layout', 'store_name', 'site_name', 'site_description'] },
      },
    }),
    prisma.storeSettings.findFirst(),
  ])

  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  const activeLayout = map.active_layout || 'dark-grunge'
  const storeName = map.store_name || map.site_name || 'DarkShop'
  const discordUrl = storeSettings?.discordUrl ?? null

  return (
    <>
      <LayoutThemeApplier layout={activeLayout} />
      <StoreLayout storeName={storeName} discordUrl={discordUrl}>
        {children}
      </StoreLayout>
    </>
  )
}
