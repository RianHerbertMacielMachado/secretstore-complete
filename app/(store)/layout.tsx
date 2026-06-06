import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DarkShop — Produtos Digitais Premium',
  description: 'Sua loja de produtos digitais com estética gótica',
}

export default function StoreGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
