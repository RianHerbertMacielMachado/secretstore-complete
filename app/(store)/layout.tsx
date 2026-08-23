import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import LayoutThemeApplier from '@/components/layouts/LayoutThemeApplier'
import StoreLayout from '@/components/layouts/StoreLayout'

// ISR: regenera a cada 60 s; elimina force-dynamic em todas as páginas da loja
export const revalidate = 60

// ─── Metadados gerados a partir do MESMO mapa já carregado abaixo ────────────
// Usamos uma função separada porque Next.js exige exportação nomeada,
// mas evitamos uma segunda query ao banco reutilizando as mesmas chaves.
export async function generateMetadata(): Promise<Metadata> {
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: ['store_name', 'site_name', 'site_description'] } },
    select: { key: true, value: true },
  })
  const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const name = map.store_name || map.site_name || 'DarkShop'
  const desc =
    map.site_description || 'Sua loja de produtos digitais com estética gótica e e-girl'

  return {
    title: `${name} — Produtos Digitais Premium`,
    description: desc,
  }
}

export default async function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  // Única rodada de queries para todo o layout — Next.js deduplica chamadas
  // idênticas dentro do mesmo render graças ao Request Memoization.
  const [configs, storeSettings, tickerItems] = await Promise.all([
    prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            'active_layout',
            'store_name',
            'site_name',
            'site_description',
            // Ticker
            'ticker_enabled',
            'ticker_speed',
            'ticker_color',
            // Popup de cupom
            'popup_enabled',
            'popup_discount',
            'popup_code',
            'popup_expiry_hours',
            'popup_cta_text',
            'popup_cta_link',
            'popup_delay_seconds',
            'popup_design',
            'popup_color_accent',
            'popup_color_text',
            'popup_color_bg',
            'popup_color_timer_bg',
          ],
        },
      },
      select: { key: true, value: true },
    }),
    prisma.storeSettings.findFirst({
      select: { discordUrl: true, socialLinks: true },
    }),
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

  // Parse socialLinks
  let socialLinks: { id: string; network: string; url: string; label?: string }[] = []
  try {
    const raw = (storeSettings as any)?.socialLinks
    if (raw && typeof raw === 'string') {
      socialLinks = JSON.parse(raw)
    }
  } catch {}

  // Dados do ticker
  const tickerEnabled = map.ticker_enabled === 'true'
  const tickerSpeed = map.ticker_speed || 'medium'
  const tickerColor = map.ticker_color || '#ffffff'

  // Dados do popup de cupom
  const popupEnabled = map.popup_enabled === 'true'
  const popupConfig =
    popupEnabled && map.popup_code
      ? {
          enabled: true,
          discount: map.popup_discount || '15',
          code: map.popup_code,
          expiryHours: parseInt(map.popup_expiry_hours || '24', 10),
          ctaText: map.popup_cta_text || 'RESGATAR OFERTA',
          ctaLink: map.popup_cta_link || '/',
          delaySeconds: parseInt(map.popup_delay_seconds || '3', 10),
          design: (map.popup_design || 'classic') as 'classic' | 'minimal' | 'bold',
          colors: {
            accentColor: map.popup_color_accent || '#dc2626',
            textColor: map.popup_color_text || '#ffffff',
            bgColor: map.popup_color_bg || '#0d0d0d',
            timerBg: map.popup_color_timer_bg || '#1f1f1f',
          },
        }
      : null

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
