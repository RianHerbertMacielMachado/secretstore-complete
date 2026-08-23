import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import LayoutThemeApplier from '@/components/layouts/LayoutThemeApplier'
import StoreLayout from '@/components/layouts/StoreLayout'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
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
  } catch {
    return {
      title: 'DarkShop — Produtos Digitais Premium',
      description: 'Sua loja de produtos digitais',
    }
  }
}

export default async function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  let activeLayout = 'dark-grunge'
  let storeName = 'DarkShop'
  let discordUrl: string | null = null
  let socialLinks: { id: string; network: string; url: string; label?: string }[] = []
  let tickerItems: { id: string; text: string }[] = []
  let tickerEnabled = false
  let tickerSpeed = 'medium'
  let tickerColor = '#ffffff'
  let popupConfig: any = null

  try {
    const [configs, storeSettings, rawTickerItems] = await Promise.all([
      prisma.siteConfig.findMany({
        where: {
          key: {
            in: [
              'active_layout', 'store_name', 'site_name', 'site_description',
              'ticker_enabled', 'ticker_speed', 'ticker_color',
              'popup_enabled', 'popup_discount', 'popup_code',
              'popup_expiry_hours', 'popup_cta_text', 'popup_cta_link', 'popup_delay_seconds',
              'popup_design',
              'popup_color_accent', 'popup_color_text', 'popup_color_bg', 'popup_color_timer_bg',
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

    activeLayout = map.active_layout || 'dark-grunge'
    storeName = map.store_name || map.site_name || 'DarkShop'
    discordUrl = storeSettings?.discordUrl ?? null
    tickerItems = rawTickerItems
    tickerEnabled = map.ticker_enabled === 'true'
    tickerSpeed = map.ticker_speed || 'medium'
    tickerColor = map.ticker_color || '#ffffff'

    try {
      const raw = (storeSettings as any)?.socialLinks
      if (raw && typeof raw === 'string') {
        socialLinks = JSON.parse(raw)
      }
    } catch {}

    const popupEnabled = map.popup_enabled === 'true'
    if (popupEnabled && map.popup_code) {
      popupConfig = {
        enabled: true,
        discount: map.popup_discount || '15',
        code: map.popup_code,
        expiryHours: parseInt(map.popup_expiry_hours || '24', 10),
        ctaText: map.popup_cta_text || 'RESGATAR OFERTA',
        ctaLink: map.popup_cta_link || '/',
        delaySeconds: parseInt(map.popup_delay_seconds || '3', 10),
        design: (map.popup_design || 'classic') as 'classic' | 'minimal' | 'bold',
        colors: {
          accentColor:  map.popup_color_accent   || '#dc2626',
          textColor:    map.popup_color_text     || '#ffffff',
          bgColor:      map.popup_color_bg       || '#0d0d0d',
          timerBg:      map.popup_color_timer_bg || '#1f1f1f',
        },
      }
    }
  } catch (err: any) {
    console.error('[StoreLayout] erro Prisma:', err?.message ?? err)
    // Usa valores padrão definidos acima — loja funciona sem configurações do DB
  }

  return (
    <>
      <LayoutThemeApplier layout={activeLayout} />
      <StoreLayout
        storeName={storeName}
        discordUrl={discordUrl}
        socialLinks={socialLinks}
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
