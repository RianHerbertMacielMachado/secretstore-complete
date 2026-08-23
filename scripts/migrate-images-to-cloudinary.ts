/**
 * scripts/migrate-images-to-cloudinary.ts
 *
 * Migra todas as imagens armazenadas como Base64 no PostgreSQL para o Cloudinary,
 * atualizando os campos `mainImage` (Product) e `url` (ProductImage) com as
 * URLs públicas retornadas pelo Cloudinary.
 *
 * ── PRÉ-REQUISITOS ────────────────────────────────────────────────────────────
 *  1. Variáveis de ambiente preenchidas (no .env ou exportadas no terminal):
 *       DATABASE_URL=postgresql://...        ← banco de produção do Railway
 *       CLOUDINARY_CLOUD_NAME=seu_cloud
 *       CLOUDINARY_API_KEY=sua_key
 *       CLOUDINARY_API_SECRET=seu_secret
 *
 *  2. Dependências instaladas:
 *       npm install cloudinary @prisma/client   (já estão no package.json)
 *
 * ── COMO RODAR ────────────────────────────────────────────────────────────────
 *  No terminal, dentro da pasta do projeto:
 *
 *    # Dry-run (apenas mostra o que seria migrado, não altera nada):
 *    npx tsx scripts/migrate-images-to-cloudinary.ts --dry-run
 *
 *    # Migração real:
 *    npx tsx scripts/migrate-images-to-cloudinary.ts
 *
 * ── SEGURANÇA ─────────────────────────────────────────────────────────────────
 *  - O script é idempotente: ignora registros que já têm URL do Cloudinary
 *    (começa com "https://res.cloudinary.com") ou que não são Base64.
 *  - Em caso de erro num registro individual, pula e continua (não aborta tudo).
 *  - Ao final exibe um resumo completo de sucesso / falha / ignorado.
 */

import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// ── Configuração ──────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')

const REQUIRED_VARS = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

// Pausa entre uploads para evitar rate limit da API do Cloudinary (free: 500/hora)
const DELAY_MS = 200

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function isBase64DataUrl(value: string): boolean {
  return value.startsWith('data:image/')
}

function isAlreadyCloudinary(value: string): boolean {
  return value.startsWith('https://res.cloudinary.com')
}

function shouldMigrate(value: string | null | undefined): boolean {
  if (!value) return false
  if (isAlreadyCloudinary(value)) return false
  if (isBase64DataUrl(value)) return true
  // URL externa de outra origem — não mexe
  return false
}

async function uploadToCloudinary(dataUrl: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUrl,
      {
        public_id:     publicId,
        folder:        'secretstore',
        resource_type: 'image',
        overwrite:     false,   // não reprocessa se já existir com o mesmo ID
        quality:       'auto',
        fetch_format:  'auto',
      },
      (error: any, result?: UploadApiResponse) => {
        if (error || !result) return reject(error ?? new Error('Upload sem resultado'))
        resolve(result.secure_url)
      }
    )
  })
}

// ── Contadores ────────────────────────────────────────────────────────────────

const stats = {
  mainImage:    { migrated: 0, skipped: 0, failed: 0 },
  productImage: { migrated: 0, skipped: 0, failed: 0 },
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Validar variáveis de ambiente
  const missing = REQUIRED_VARS.filter((v) => !process.env[v])
  if (missing.length > 0) {
    console.error('\n❌ Variáveis de ambiente faltando:')
    missing.forEach((v) => console.error(`   • ${v}`))
    console.error('\nAdicione-as ao .env ou exporte no terminal antes de rodar o script.\n')
    process.exit(1)
  }

  // 2. Configurar Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure:     true,
  })

  // 3. Conectar ao banco
  const prisma = new PrismaClient()

  console.log('\n════════════════════════════════════════════════════════════')
  console.log('  Migração de imagens: PostgreSQL Base64 → Cloudinary')
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (nenhuma alteração será feita)' : '🚀 PRODUÇÃO'}`)
  console.log('════════════════════════════════════════════════════════════\n')

  try {
    // ── PARTE 1: Product.mainImage ──────────────────────────────────────────
    console.log('▶ Buscando produtos com mainImage para migrar...')

    const products = await prisma.product.findMany({
      select: { id: true, slug: true, mainImage: true },
    })

    const productsToMigrate = products.filter((p) => shouldMigrate(p.mainImage))
    const productsSkipped   = products.filter((p) => !shouldMigrate(p.mainImage))

    console.log(`  Total de produtos:     ${products.length}`)
    console.log(`  ↳ Para migrar:         ${productsToMigrate.length}`)
    console.log(`  ↳ Já ok / sem imagem:  ${productsSkipped.length}\n`)

    for (const product of productsToMigrate) {
      process.stdout.write(`  [Product] ${product.slug} ... `)
      try {
        if (!DRY_RUN) {
          const newUrl = await uploadToCloudinary(
            product.mainImage,
            `products/main_${product.id}`
          )
          await prisma.product.update({
            where: { id: product.id },
            data:  { mainImage: newUrl },
          })
          process.stdout.write(`✅ ${newUrl}\n`)
        } else {
          process.stdout.write(`[dry-run] seria migrado\n`)
        }
        stats.mainImage.migrated++
        await sleep(DELAY_MS)
      } catch (err: any) {
        process.stdout.write(`❌ ERRO: ${err?.message ?? err}\n`)
        stats.mainImage.failed++
      }
    }

    stats.mainImage.skipped = productsSkipped.length

    // ── PARTE 2: ProductImage.url ───────────────────────────────────────────
    console.log('\n▶ Buscando ProductImages com url Base64 para migrar...')

    const productImages = await prisma.productImage.findMany({
      select: { id: true, url: true, productId: true, order: true },
    })

    const imagesToMigrate = productImages.filter((i) => shouldMigrate(i.url))
    const imagesSkipped   = productImages.filter((i) => !shouldMigrate(i.url))

    console.log(`  Total de ProductImages:  ${productImages.length}`)
    console.log(`  ↳ Para migrar:           ${imagesToMigrate.length}`)
    console.log(`  ↳ Já ok / sem imagem:    ${imagesSkipped.length}\n`)

    for (const img of imagesToMigrate) {
      process.stdout.write(`  [ProductImage] ${img.id} (produto ${img.productId}, ordem ${img.order}) ... `)
      try {
        if (!DRY_RUN) {
          const newUrl = await uploadToCloudinary(
            img.url,
            `products/gallery_${img.id}`
          )
          await prisma.productImage.update({
            where: { id: img.id },
            data:  { url: newUrl },
          })
          process.stdout.write(`✅ ${newUrl}\n`)
        } else {
          process.stdout.write(`[dry-run] seria migrado\n`)
        }
        stats.productImage.migrated++
        await sleep(DELAY_MS)
      } catch (err: any) {
        process.stdout.write(`❌ ERRO: ${err?.message ?? err}\n`)
        stats.productImage.failed++
      }
    }

    stats.productImage.skipped = imagesSkipped.length

    // ── RESUMO ──────────────────────────────────────────────────────────────
    const totalMigrated = stats.mainImage.migrated + stats.productImage.migrated
    const totalFailed   = stats.mainImage.failed   + stats.productImage.failed

    console.log('\n════════════════════════════════════════════════════════════')
    console.log('  RESUMO DA MIGRAÇÃO')
    console.log('════════════════════════════════════════════════════════════')
    console.log(`  Product.mainImage`)
    console.log(`    ✅ Migrados:  ${stats.mainImage.migrated}`)
    console.log(`    ⏭  Ignorados: ${stats.mainImage.skipped}`)
    console.log(`    ❌ Falhas:    ${stats.mainImage.failed}`)
    console.log(`  ProductImage.url`)
    console.log(`    ✅ Migrados:  ${stats.productImage.migrated}`)
    console.log(`    ⏭  Ignorados: ${stats.productImage.skipped}`)
    console.log(`    ❌ Falhas:    ${stats.productImage.failed}`)
    console.log('────────────────────────────────────────────────────────────')
    console.log(`  Total migrados: ${totalMigrated}`)
    console.log(`  Total falhas:   ${totalFailed}`)
    if (DRY_RUN) {
      console.log('\n  ⚠️  Dry-run concluído. Nenhuma alteração foi feita.')
      console.log('  Rode sem --dry-run para aplicar a migração real.')
    } else if (totalFailed === 0) {
      console.log('\n  🎉 Migração concluída com sucesso! Todas as imagens')
      console.log('  estão agora no Cloudinary. Os Base64 foram removidos do banco.')
    } else {
      console.log(`\n  ⚠️  ${totalFailed} imagem(ns) falharam. Verifique os erros acima`)
      console.log('  e rode o script novamente — os já migrados serão ignorados.')
    }
    console.log('════════════════════════════════════════════════════════════\n')

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
