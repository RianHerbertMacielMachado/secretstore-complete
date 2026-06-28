import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import CategoriesSection from '@/components/store/CategoriesSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [featuredProducts, allProducts, categories, configs] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE', featured: true },
      include: {
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true, slug: true } },
          },
        },
        productImages: { orderBy: { order: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true, slug: true } },
          },
        },
        productImages: { orderBy: { order: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: ['store_name', 'store_subtitle', 'site_name'] } },
    }),
  ])

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const storeName = configMap.store_name || configMap.site_name || 'DarkShop'
  const storeSubtitle =
    configMap.store_subtitle || 'Produtos digitais com estética gótica e entrega imediata'

  // Normalize products to include `category` field for compatibility with FeaturedProducts
  const normalizeProduct = (p: typeof featuredProducts[0]) => ({
    ...p,
    mainImage: p.productImages[0]?.url || p.mainImage,
    category: { name: p.subCategory.name },
  })

  return (
    <>
      <HeroSection storeName={storeName} storeSubtitle={storeSubtitle} />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={featuredProducts.map(normalizeProduct)} title="Em Destaque" />
      <FeaturedProducts products={allProducts.map(normalizeProduct)} title="Todos os Produtos" showAll />
    </>
  )
}
