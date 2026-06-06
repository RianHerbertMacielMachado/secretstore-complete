import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import CategoriesSection from '@/components/store/CategoriesSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [products, categories, configs] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE', featured: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: ['store_name', 'store_subtitle', 'site_name'] } },
    }),
  ])

  const allProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  // Fallback: se o usuário ainda não salvou store_name, usa site_name (chave legada)
  const storeName    = configMap.store_name || configMap.site_name || 'DarkShop'
  const storeSubtitle =
    configMap.store_subtitle || 'Produtos digitais com estética gótica e entrega imediata'

  return (
    <>
      <HeroSection storeName={storeName} storeSubtitle={storeSubtitle} />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={products} title="Em Destaque" />
      <FeaturedProducts products={allProducts} title="Todos os Produtos" showAll />
    </>
  )
}
