import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import HeroCarousel from '@/components/store/HeroCarousel'

// ISR: hero e carrossel raramente mudam — cachear por 60 s elimina queries
// repetidas a cada navegação. try/catch garante que o build sem DATABASE_URL
// (Railway CI) não falhe — renderiza com valores padrão nesse caso.
export const revalidate = 60

export default async function HomePage() {
  let carouselItems: { id: string; name: string; image: string; link: string }[] = []
  let heroBgs: { id: string; image: string }[] = []
  let storeName = 'DarkShop'
  let storeSubtitle = 'Produtos digitais e entrega imediata'
  let heroInterval = 5

  try {
    const [carousel, bgs, configs] = await Promise.all([
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
        select: { key: true, value: true },
      }),
    ])

    carouselItems = carousel
    heroBgs = bgs

    const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    storeName = configMap.store_name || configMap.site_name || 'DarkShop'
    storeSubtitle = configMap.store_subtitle || 'Produtos digitais e entrega imediata'
    heroInterval = parseInt(configMap.hero_interval || '5', 10)
  } catch {
    // Build sem DATABASE_URL — renderiza com valores padrão
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
