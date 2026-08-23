import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProdutosClient from '@/components/store/ProdutosClient'

interface Props {
  params: { slug: string; subSlug: string }
}

export const dynamicParams = true

// Remove null bytes (U+0000) — digest 402100154
function s(v: string | null | undefined): string {
  return (v ?? '').replace(/\u0000/g, '')
}

export async function generateStaticParams() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: { isVisible: true },
      select: { slug: true, category: { select: { slug: true } } },
    })
    return subCategories.map((sc) => ({ slug: sc.category.slug, subSlug: sc.slug }))
  } catch {
    return []
  }
}

export default async function SubCategoriaSlugPage({ params }: Props) {
  try {
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
    if (subCategory.category.slug !== params.slug) notFound()

    const productsPerPage = storeSettings?.productsPerPage ?? 15

    return (
      <ProdutosClient
        products={subCategory.products.map((p) => ({
          ...p,
          name: s(p.name),
          slug: s(p.slug),
          description: s(p.description),
          mainImage: s(p.mainImage),
          driveLink: s(p.driveLink),
          youtubeUrl: p.youtubeUrl ? s(p.youtubeUrl) : null,
          images: p.productImages.map((img) => s(img.url)),
          category: p.subCategory.category,
          subCategoryId: p.subCategoryId,
          categoryId: p.subCategory.categoryId,
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
  } catch (err: any) {
    console.error('[SubCategoriaPage] erro Prisma:', err?.message ?? err)
    notFound()
  }
}
