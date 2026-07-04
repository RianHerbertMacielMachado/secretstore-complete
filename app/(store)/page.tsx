import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/store/HeroSection'
import CategoriesSection from '@/components/store/CategoriesSection'
import ProductsCarousel from '@/components/store/ProductsCarousel'
import HeroCarousel from '@/components/store/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [carouselItems, featuredProducts, allProducts, categories, configs] = await Promise.all([
    // Itens do carrossel configurável pelo admin
    prisma.carouselItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, image: true, link: true },
    }),
    // Produtos em destaque (para o carrossel de produtos abaixo)
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

  // Normaliza produtos para compatibilidade com ProductsCarousel
  const normalizeProduct = (p: typeof featuredProducts[0]) => ({
    ...p,
    mainImage: p.productImages[0]?.url || p.mainImage,
    category: { name: p.subCategory.name },
  })

  return (
    <>
      {/* HeroSection sempre no topo — não é afetado pelo carrossel admin */}
      <HeroSection storeName={storeName} storeSubtitle={storeSubtitle} />

      <CategoriesSection categories={categories} />

      {/* Carrossel configurável pelo admin — aparece entre as categorias e os produtos */}
      {carouselItems.length > 0 && (
        <HeroCarousel items={carouselItems} />
      )}

      {/* Carrossel de produtos em destaque */}
      {featuredProducts.length > 0 && (
        <ProductsCarousel products={featuredProducts.map(normalizeProduct)} title="Em Destaque" />
      )}

      {/* Todos os produtos */}
      <ProductsCarousel products={allProducts.map(normalizeProduct)} title="Todos os Produtos" showAll />
    </>
  )
}
