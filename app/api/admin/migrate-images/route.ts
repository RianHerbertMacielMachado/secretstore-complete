import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Proteção dupla: só ADMIN + secret header
async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

function setupCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure:     true,
  })
}

function cloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

function isBase64DataUrl(v: string) {
  return v.startsWith('data:image/')
}

function isAlreadyCloudinary(v: string) {
  return v.startsWith('https://res.cloudinary.com')
}

function shouldMigrate(v: string | null | undefined): v is string {
  if (!v) return false
  if (isAlreadyCloudinary(v)) return false
  return isBase64DataUrl(v)
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function uploadOne(dataUrl: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUrl,
      { public_id: publicId, folder: 'secretstore', resource_type: 'image',
        overwrite: false, quality: 'auto', fetch_format: 'auto' },
      (err: any, result?: UploadApiResponse) => {
        if (err || !result) return reject(err ?? new Error('sem resultado'))
        resolve(result.secure_url)
      }
    )
  })
}

export async function GET(req: NextRequest) {
  // Verifica secret de segurança no header ou query param
  const secret = req.nextUrl.searchParams.get('secret') ||
                 req.headers.get('x-migrate-secret')
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Requer sessão de admin' }, { status: 403 })
  }

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no Railway.' },
      { status: 400 }
    )
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === '1'

  setupCloudinary()

  const stats = {
    mainImage:    { migrated: 0, skipped: 0, failed: 0, errors: [] as string[] },
    productImage: { migrated: 0, skipped: 0, failed: 0, errors: [] as string[] },
  }

  // ── Part 1: Product.mainImage ─────────────────────────────────────────────
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, mainImage: true },
  })

  for (const p of products) {
    if (!shouldMigrate(p.mainImage)) {
      stats.mainImage.skipped++
      continue
    }
    try {
      if (!dryRun) {
        const url = await uploadOne(p.mainImage, `products/main_${p.id}`)
        await prisma.product.update({ where: { id: p.id }, data: { mainImage: url } })
      }
      stats.mainImage.migrated++
      await sleep(150)
    } catch (err: any) {
      stats.mainImage.failed++
      stats.mainImage.errors.push(`${p.slug}: ${err?.message ?? err}`)
    }
  }

  // ── Part 2: ProductImage.url ──────────────────────────────────────────────
  const productImages = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true, order: true },
  })

  for (const img of productImages) {
    if (!shouldMigrate(img.url)) {
      stats.productImage.skipped++
      continue
    }
    try {
      if (!dryRun) {
        const url = await uploadOne(img.url, `products/gallery_${img.id}`)
        await prisma.productImage.update({ where: { id: img.id }, data: { url } })
      }
      stats.productImage.migrated++
      await sleep(150)
    } catch (err: any) {
      stats.productImage.failed++
      stats.productImage.errors.push(`${img.id}: ${err?.message ?? err}`)
    }
  }

  return NextResponse.json({
    dryRun,
    stats,
    totalMigrated: stats.mainImage.migrated + stats.productImage.migrated,
    totalFailed:   stats.mainImage.failed   + stats.productImage.failed,
    totalSkipped:  stats.mainImage.skipped  + stats.productImage.skipped,
    message: dryRun
      ? 'Dry-run concluído. Nenhuma alteração feita. Rode sem ?dry=1 para migrar.'
      : 'Migração concluída.',
  })
}
