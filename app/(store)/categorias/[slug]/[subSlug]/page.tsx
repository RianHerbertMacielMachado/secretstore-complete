import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProdutosClient from '@/components/store/ProdutosClient'

interface Props {
  params: { slug: string; subSlug: string }
}

export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: { isVisible: true },
      select: { slug: true, category: { select: { slug: true } } },
    })
    return subCategories.map((s) => ({ slug: s.category.slug, subSlug: s.slug }))
  } catch {
    return []
  }
}

export default async function SubCategoriaSlugPage({ params }: Props) {
  const [subCategory, allCategories, storeSettings] = await Promise.all([
    prisma.subCategory.findUnique({
      where: { slug: params.subSlug },
      include: {
        category: true,
        products: {
          where: { status: 'ACTIVE' },
          include: {
            subCategory: {
              include: { category: true },
            },
            productImages: { orderBy: { order: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.storeSettings.findFirst(),
  ])

  if (!subCategory || !subCategory.isVisible) notFound()

  // Ensure the subCategory belongs to the given category slug
  if (subCategory.category.slug !== params.slug) notFound()

  const productsPerPage = storeSettings?.productsPerPage ?? 15

  return (
    <ProdutosClient
      products={subCategory.products.map((p) => ({
        ...p,
        images: p.productImages.map((img) => img.url),
        category: p.subCategory.category,
      }))}
      categories={allCategories}
      activeCategory={params.slug}
      searchQuery=""
      sortOrder="recentes"
      subCategoryName={subCategory.name}
      categoryName={subCategory.category.name}
      categorySlug={params.slug}
      productsPerPage={productsPerPage}
      subCategoryBannerImage={subCategory.bannerImage ?? null}
    />
  )
}
