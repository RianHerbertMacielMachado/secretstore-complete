import StoreNavbar from '@/components/shared/StoreNavbar'
import StoreFooter from '@/components/shared/StoreFooter'

interface StoreLayoutProps {
  children: React.ReactNode
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <div className="min-h-screen bg-graffiti flex flex-col">
      <StoreNavbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <StoreFooter />
    </div>
  )
}
