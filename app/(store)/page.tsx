import { prisma } from '@/lib/prisma'
import StoreLayout from '@/components/layouts/StoreLayout'
import HeroSection from '@/components/store/HeroSection'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import CategoriesSection from '@/components/store/CategoriesSection'

export default async function HomePage() {
  const [products, categories] = await Promise.all([
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
  ])

  const allProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return (
    <StoreLayout>
      <HeroSection />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={products} title="Em Destaque" />
      <FeaturedProducts products={allProducts} title="Todos os Produtos" showAll />
    </StoreLayout>
  )
}
