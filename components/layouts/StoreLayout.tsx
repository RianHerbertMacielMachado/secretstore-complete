import StoreNavbar from '@/components/shared/StoreNavbar'
import StoreFooter from '@/components/shared/StoreFooter'
import TopTicker from '@/components/store/TopTicker'
import CouponPopup from '@/components/store/CouponPopup'

interface TickerItem {
  id: string
  text: string
}

interface PopupConfig {
  enabled: boolean
  discount: string
  code: string
  expiryHours: number
  ctaText: string
  ctaLink: string
  delaySeconds: number
}

interface StoreLayoutProps {
  children: React.ReactNode
  storeName?: string
  discordUrl?: string | null
  tickerItems?: TickerItem[]
  tickerEnabled?: boolean
  tickerSpeed?: string
  tickerColor?: string
  popupConfig?: PopupConfig | null
}

export default function StoreLayout({
  children,
  storeName = 'DarkShop',
  discordUrl,
  tickerItems = [],
  tickerEnabled = false,
  tickerSpeed = 'medium',
  tickerColor = '#ffffff',
  popupConfig = null,
}: StoreLayoutProps) {
  const showTicker = tickerEnabled && tickerItems.length > 0
  // Altura da faixa do topo: 36px quando ativa, 0 quando não
  const tickerHeight = showTicker ? 36 : 0

  return (
    <div className="min-h-screen bg-graffiti flex flex-col">
      {/* Faixa de avisos acima do navbar */}
      {showTicker && (
        <TopTicker
          items={tickerItems}
          speed={tickerSpeed}
          color={tickerColor}
        />
      )}

      {/* Navbar — deslocado para baixo da faixa quando ela está ativa */}
      <StoreNavbar
        storeName={storeName}
        tickerHeight={tickerHeight}
      />

      {/* Conteúdo principal — padding-top considera navbar (64px) + faixa */}
      <main
        className="flex-1"
        style={{ paddingTop: `${64 + tickerHeight}px` }}
      >
        {children}
      </main>

      <StoreFooter storeName={storeName} discordUrl={discordUrl} />

      {/* Popup flutuante de cupom */}
      {popupConfig && <CouponPopup config={popupConfig} />}
    </div>
  )
}
