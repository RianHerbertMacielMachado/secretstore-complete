import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProductDetailClient from '@/components/store/ProductDetailClient'

interface Props {
  params: { slug: string }
}

export const dynamicParams = true
// ISR: páginas de produto são estáticas na maior parte do tempo;
// regenerar a cada 5 min é suficiente para refletir atualizações de preço/estoque.
export const revalidate = 300

// Helper: remove null bytes que causam "Failed to convert rust String into napi string"
function sanitize(s: string | null | undefined): string {
  return (s ?? '').replace(/\u0000/g, '')
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true },
    })
    return products.map((p) => ({ slug: sanitize(p.slug) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        subCategory: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    })

    if (!product) return { title: 'Produto não encontrado' }

    const name = sanitize(product.name)
    const desc = sanitize(product.description).slice(0, 160)
    const image = sanitize(product.mainImage)

    return {
      title: `${name} | SecretStore`,
      description: desc,
      keywords: [name, sanitize(product.subCategory.name), sanitize(product.subCategory.category.name), 'produto digital'],
      openGraph: {
        title: name,
        description: desc,
        images: [{ url: image, alt: name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: name,
        description: desc,
        images: [image],
      },
    }
  } catch {
    return { title: 'Produto | SecretStore' }
  }
}

export default async function ProductPage({ params }: Props) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        subCategory: {
          include: { category: true },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    if (!product) notFound()

    // Related products: same subCategory
    const related = await prisma.product.findMany({
      where: {
        subCategoryId: product.subCategoryId,
        status: 'ACTIVE',
        id: { not: product.id },
      },
      take: 4,
      include: {
        subCategory: {
          include: { category: true },
        },
        productImages: { orderBy: { order: 'asc' } },
      },
    })

    // Sanitiza null bytes antes de passar para o Client Component
    const sanitizedProduct = {
      ...product,
      name: sanitize(product.name),
      slug: sanitize(product.slug),
      description: sanitize(product.description),
      mainImage: sanitize(product.mainImage),
      driveLink: sanitize(product.driveLink),
      youtubeUrl: product.youtubeUrl ? sanitize(product.youtubeUrl) : null,
      images: product.productImages.map((img) => sanitize(img.url)),
    }

    const sanitizedRelated = related.map((r) => ({
      ...r,
      name: sanitize(r.name),
      slug: sanitize(r.slug),
      description: sanitize(r.description),
      mainImage: sanitize(r.mainImage),
      images: r.productImages.map((img) => sanitize(img.url)),
    }))

    return (
      <ProductDetailClient
        product={sanitizedProduct}
        related={sanitizedRelated}
      />
    )
  } catch (err: any) {
    console.error('[ProductPage] Erro ao buscar produto:', err?.message ?? err)
    notFound()
  }
}
