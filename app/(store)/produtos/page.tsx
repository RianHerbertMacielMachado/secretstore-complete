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

function s(v: string | null | undefined): string {
  return (v ?? '').replace(/\u0000/g, '')
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { categoria, busca, ordem } = searchParams

  let products: any[] = []
  let categories: any[] = []
  let productsPerPage = 15
  let errorMsg: string | null = null

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
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          mainImage: true,
          featured: true,
          status: true,
          description: true,
          driveLink: true,
          youtubeUrl: true,
          subCategoryId: true,
          subCategory: {
            select: {
              id: true,
              slug: true,
              categoryId: true,
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
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
      category: p.subCategory.category,
      subCategoryId: p.subCategoryId,
      categoryId: p.subCategory.categoryId,
    }))
  } catch (err: any) {
    errorMsg = err?.message ?? String(err)
    console.error('[ProdutosPage] erro Prisma:', errorMsg)
  }

  // Mostra o erro real em dev ou para facilitar diagnóstico em produção
  if (errorMsg && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-white/60 text-lg">Erro ao carregar produtos.</p>
        <pre className="text-red-400 text-xs bg-white/5 rounded-lg p-4 max-w-2xl w-full overflow-auto whitespace-pre-wrap">
          {errorMsg}
        </pre>
      </div>
    )
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
