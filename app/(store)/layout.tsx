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
  // Busca todos os configs necessários, configurações da loja, ticker e popup de uma vez
  const [configs, storeSettings, tickerItems] = await Promise.all([
    prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            'active_layout', 'store_name', 'site_name', 'site_description',
            // Configurações do ticker
            'ticker_enabled', 'ticker_speed', 'ticker_color',
            // Configurações do popup
            'popup_enabled', 'popup_discount', 'popup_code',
            'popup_expiry_hours', 'popup_cta_text', 'popup_cta_link', 'popup_delay_seconds',
          ],
        },
      },
    }),
    prisma.storeSettings.findFirst(),
    prisma.tickerItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, text: true },
    }),
  ])

  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  const activeLayout = map.active_layout || 'dark-grunge'
  const storeName = map.store_name || map.site_name || 'DarkShop'
  const discordUrl = storeSettings?.discordUrl ?? null

  // Dados do ticker
  const tickerEnabled = map.ticker_enabled === 'true'
  const tickerSpeed = map.ticker_speed || 'medium'
  const tickerColor = map.ticker_color || '#ffffff'

  // Dados do popup de cupom
  const popupEnabled = map.popup_enabled === 'true'
  const popupConfig = popupEnabled && map.popup_code ? {
    enabled: true,
    discount: map.popup_discount || '15',
    code: map.popup_code,
    expiryHours: parseInt(map.popup_expiry_hours || '24', 10),
    ctaText: map.popup_cta_text || 'RESGATAR OFERTA',
    ctaLink: map.popup_cta_link || '/',
    delaySeconds: parseInt(map.popup_delay_seconds || '3', 10),
  } : null

  return (
    <>
      <LayoutThemeApplier layout={activeLayout} />
      <StoreLayout
        storeName={storeName}
        discordUrl={discordUrl}
        tickerItems={tickerItems}
        tickerEnabled={tickerEnabled}
        tickerSpeed={tickerSpeed}
        tickerColor={tickerColor}
        popupConfig={popupConfig}
      >
        {children}
      </StoreLayout>
    </>
  )
}
