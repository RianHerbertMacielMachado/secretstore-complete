import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import HeroCarousel from '@/components/store/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [carouselItems, configs] = await Promise.all([
    prisma.carouselItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, image: true, link: true },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: ['store_name', 'store_subtitle', 'site_name'] } },
    }),
  ])

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const storeName = configMap.store_name || configMap.site_name || 'DarkShop'
  const storeSubtitle =
    configMap.store_subtitle || 'Produtos digitais e entrega imediata'

  return (
    <>
      {/* Hero fixo no topo */}
      <HeroSection storeName={storeName} storeSubtitle={storeSubtitle} />

      {/* Carrossel de miniaturas configurável pelo admin */}
      {carouselItems.length > 0 && (
        <HeroCarousel items={carouselItems} title="Destaques" />
      )}
    </>
  )
}
