import { prisma } from '@/lib/prisma'
import ProdutosClient from '@/components/store/ProdutosClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Produtos | SecretStore',
  description: 'Explore nossa coleção de produtos digitais exclusivos',
}

interface Props {
  searchParams: { categoria?: string; busca?: string; ordem?: string }
}

// Remove null bytes (U+0000) que causam:
//   PrismaClientKnownRequestError: Failed to convert rust `String` into napi `string`
//   digest: '402100154'
// Nenhuma migration necessária — sanitização feita no JS antes de passar ao cliente.
function s(v: string | null | undefined): string {
  return (v ?? '').replace(/\u0000/g, '')
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { categoria, busca, ordem } = searchParams

  let products: any[] = []
  let categories: any[] = []
  let productsPerPage = 15

  try {
    const [rawProducts, rawCategories, storeSettings] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          ...(categoria ? { subCategory: { category: { slug: categoria } } } : {}),
          ...(busca
            ? {
                OR: [
                  { name: { contains: busca, mode: 'insensitive' } },
                  { description: { contains: busca, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: {
          subCategory: {
            include: { category: true },
          },
          productImages: { orderBy: { order: 'asc' } },
        },
        orderBy:
          ordem === 'preco-asc'
            ? { price: 'asc' }
            : ordem === 'preco-desc'
            ? { price: 'desc' }
            : ordem === 'nome'
            ? { name: 'asc' }
            : { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.storeSettings.findFirst(),
    ])

    categories = rawCategories
    productsPerPage = storeSettings?.productsPerPage ?? 15

    products = rawProducts.map((p) => ({
      ...p,
      name: s(p.name),
      slug: s(p.slug),
      description: s(p.description),
      mainImage: s(p.mainImage),
      driveLink: s(p.driveLink),
      youtubeUrl: p.youtubeUrl ? s(p.youtubeUrl) : null,
      images: p.productImages.map((img: any) => s(img.url)),
      category: p.subCategory.category,
      subCategoryId: p.subCategoryId,
      categoryId: p.subCategory.categoryId,
    }))
  } catch (err: any) {
    console.error('[ProdutosPage] erro Prisma:', err?.message ?? err)
    // Retorna lista vazia em vez de crash — digest 402100154 (null bytes) ou falha de DB
  }

  return (
    <ProdutosClient
      products={products}
      categories={categories}
      activeCategory={categoria || ''}
      searchQuery={busca || ''}
      sortOrder={ordem || 'recentes'}
      productsPerPage={productsPerPage}
    />
  )
}
