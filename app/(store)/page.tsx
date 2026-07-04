import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import HeroCarousel from '@/components/store/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [carouselItems, heroBgs, configs] = await Promise.all([
    // Itens do carrossel de miniaturas
    prisma.carouselItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, image: true, link: true },
    }),
    // Imagens de fundo do hero
    prisma.heroBg.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, image: true },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: ['store_name', 'store_subtitle', 'site_name', 'hero_interval'] } },
    }),
  ])

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const storeName = configMap.store_name || configMap.site_name || 'DarkShop'
  const storeSubtitle = configMap.store_subtitle || 'Produtos digitais e entrega imediata'
  const heroInterval = parseInt(configMap.hero_interval || '5', 10)

  return (
    <>
      <HeroSection
        storeName={storeName}
        storeSubtitle={storeSubtitle}
        bgImages={heroBgs.map(b => b.image)}
        bgInterval={heroInterval}
      />
      {carouselItems.length > 0 && (
        <HeroCarousel items={carouselItems} title="Destaques" />
      )}
    </>
  )
}
