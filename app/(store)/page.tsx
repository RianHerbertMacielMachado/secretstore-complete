import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import HeroCarousel from '@/components/store/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let carouselItems: { id: string; name: string; image: string; link: string }[] = []
  let heroBgs: { id: string; image: string }[] = []
  let storeName = 'DarkShop'
  let storeSubtitle = 'Produtos digitais e entrega imediata'
  let heroInterval = 5

  try {
    const [rawCarousel, rawHeroBgs, configs] = await Promise.all([
      prisma.carouselItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, image: true, link: true },
      }),
      prisma.heroBg.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, image: true },
      }),
      prisma.siteConfig.findMany({
        where: { key: { in: ['store_name', 'store_subtitle', 'site_name', 'hero_interval'] } },
      }),
    ])

    carouselItems = rawCarousel
    heroBgs = rawHeroBgs

    const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    storeName = configMap.store_name || configMap.site_name || 'DarkShop'
    storeSubtitle = configMap.store_subtitle || 'Produtos digitais e entrega imediata'
    heroInterval = parseInt(configMap.hero_interval || '5', 10)
  } catch (err: any) {
    console.error('[HomePage] erro Prisma:', err?.message ?? err)
  }

  return (
    <>
      <HeroSection
        storeName={storeName}
        storeSubtitle={storeSubtitle}
        bgImages={heroBgs.map((b) => b.image)}
        bgInterval={heroInterval}
      />
      {carouselItems.length > 0 && (
        <HeroCarousel items={carouselItems} title="Destaques" />
      )}
    </>
  )
}
