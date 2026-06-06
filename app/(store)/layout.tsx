import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import LayoutThemeApplier from '@/components/layouts/LayoutThemeApplier'

export const metadata: Metadata = {
  title: 'DarkShop — Produtos Digitais Premium',
  description: 'Sua loja de produtos digitais com estética gótica e e-girl',
}

export default async function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'active_layout' } })
  const activeLayout = config?.value || 'dark-grunge'

  return (
    <>
      <LayoutThemeApplier layout={activeLayout} />
      {children}
    </>
  )
}
