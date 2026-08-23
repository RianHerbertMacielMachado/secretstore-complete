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

    // Sanitiza null bytes (\u0000) que causam "Failed to convert rust String into napi string"
    // no driver Prisma 5 (napi/Rust). Campos afetados: name, description, mainImage, etc.
    products = rawProducts.map((p) => ({
      ...p,
      name: p.name?.replace(/\u0000/g, '') ?? '',
      slug: p.slug?.replace(/\u0000/g, '') ?? '',
      description: p.description?.replace(/\u0000/g, '') ?? '',
      mainImage: p.mainImage?.replace(/\u0000/g, '') ?? '',
      driveLink: p.driveLink?.replace(/\u0000/g, '') ?? '',
      youtubeUrl: p.youtubeUrl?.replace(/\u0000/g, '') ?? null,
    }))
  } catch (err: any) {
    // Em caso de erro de banco (ex: null bytes no Prisma 5 / InvalidArg),
    // renderiza a página com lista vazia em vez de tela preta.
    console.error('[ProdutosPage] Erro ao buscar produtos:', err?.message ?? err)
  }

  return (
    <ProdutosClient
      products={products.map((p) => ({
        ...p,
        images: p.productImages?.map((img: any) => img.url) ?? [],
        category: p.subCategory?.category,
        subCategoryId: p.subCategoryId,
        categoryId: p.subCategory?.categoryId,
      }))}
      categories={categories}
      activeCategory={categoria || ''}
      searchQuery={busca || ''}
      sortOrder={ordem || 'recentes'}
      productsPerPage={productsPerPage}
    />
  )
}
