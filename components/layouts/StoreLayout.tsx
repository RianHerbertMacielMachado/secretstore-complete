import StoreNavbar from '@/components/shared/StoreNavbar'
import StoreFooter from '@/components/shared/StoreFooter'

interface StoreLayoutProps {
  children: React.ReactNode
  storeName?: string
  storeSubtitle?: string
  discordUrl?: string | null
}

export default function StoreLayout({
  children,
  storeName = 'DarkShop',
  storeSubtitle = 'Produtos digitais com estética gótica e entrega imediata',
  discordUrl,
}: StoreLayoutProps) {
  return (
    <div className="min-h-screen bg-graffiti flex flex-col">
      <StoreNavbar storeName={storeName} />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <StoreFooter storeName={storeName} discordUrl={discordUrl} />
    </div>
  )
}
