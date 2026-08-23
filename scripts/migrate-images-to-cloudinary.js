/**
 * scripts/migrate-images-to-cloudinary.js
 *
 * Migra todas as imagens Base64 do PostgreSQL para o Cloudinary.
 * Roda como script Node.js puro — sem TypeScript, sem ESM, sem path aliases.
 *
 * ── PRÉ-REQUISITOS ────────────────────────────────────────────────────────────
 *  As variáveis abaixo devem estar no .env (ou exportadas no terminal):
 *    DATABASE_URL              ← banco de produção do Railway
 *    CLOUDINARY_CLOUD_NAME
 *    CLOUDINARY_API_KEY
 *    CLOUDINARY_API_SECRET
 *
 * ── COMO RODAR (na raiz do projeto) ──────────────────────────────────────────
 *  Dry-run (mostra o que seria migrado, não altera nada):
 *    node scripts/migrate-images-to-cloudinary.js --dry-run
 *
 *  Migração real:
 *    node scripts/migrate-images-to-cloudinary.js
 *
 * ── SEGURANÇA ─────────────────────────────────────────────────────────────────
 *  - Idempotente: ignora registros que já têm URL do Cloudinary
 *  - Em caso de erro num registro, pula e continua
 *  - Ao final exibe resumo completo
 */

'use strict'

// Carrega .env automaticamente
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const cloudinary = require('cloudinary').v2

// ── Configuração ──────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')
const DELAY_MS = 250  // pausa entre uploads (free tier: 500 req/hora)

const REQUIRED_VARS = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function shouldMigrate(value) {
  if (!value || typeof value !== 'string') return false
  if (value.startsWith('https://res.cloudinary.com')) return false  // já migrado
  if (value.startsWith('data:image/')) return true                   // Base64 → migrar
  return false  // URL externa de outra origem — não mexe
}

function uploadToCloudinary(dataUrl, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataUrl,
      {
        public_id:     publicId,
        folder:        'secretstore',
        resource_type: 'image',
        overwrite:     false,
        quality:       'auto',
        fetch_format:  'auto',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload sem resultado'))
        resolve(result.secure_url)
      }
    )
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Validar variáveis
  const missing = REQUIRED_VARS.filter((v) => !process.env[v])
  if (missing.length > 0) {
    console.error('\n❌ Variáveis de ambiente faltando:')
    missing.forEach((v) => console.error(`   • ${v}`))
    console.error('\nAdicione-as ao .env ou exporte no terminal.\n')
    process.exit(1)
  }

  // 2. Configurar Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })

  // 3. Conectar Prisma
  const prisma = new PrismaClient()

  const stats = {
    mainImage:    { migrated: 0, skipped: 0, failed: 0 },
    productImage: { migrated: 0, skipped: 0, failed: 0 },
  }

  console.log('\n════════════════════════════════════════════════════════════')
  console.log('  Migração: PostgreSQL Base64 → Cloudinary')
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (nenhuma alteração será feita)' : '🚀 PRODUÇÃO'}`)
  console.log('════════════════════════════════════════════════════════════\n')

  try {
    // ── PARTE 1: Product.mainImage ──────────────────────────────────────────
    console.log('▶ Buscando produtos...')
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, mainImage: true },
    })

    const toMigrateP = products.filter((p) => shouldMigrate(p.mainImage))
    stats.mainImage.skipped = products.length - toMigrateP.length

    console.log(`  Total: ${products.length}  |  Para migrar: ${toMigrateP.length}  |  Já ok: ${stats.mainImage.skipped}\n`)

    for (const product of toMigrateP) {
      process.stdout.write(`  [mainImage] ${product.slug} ... `)
      try {
        if (!DRY_RUN) {
          const url = await uploadToCloudinary(product.mainImage, `products/main_${product.id}`)
          await prisma.product.update({ where: { id: product.id }, data: { mainImage: url } })
          process.stdout.write(`✅ ${url}\n`)
        } else {
          process.stdout.write(`[dry-run]\n`)
        }
        stats.mainImage.migrated++
      } catch (err) {
        process.stdout.write(`❌ ${err?.message || err}\n`)
        stats.mainImage.failed++
      }
      await sleep(DELAY_MS)
    }

    // ── PARTE 2: ProductImage.url ───────────────────────────────────────────
    console.log('\n▶ Buscando imagens de galeria (ProductImage)...')
    const productImages = await prisma.productImage.findMany({
      select: { id: true, url: true, productId: true, order: true },
    })

    const toMigrateI = productImages.filter((i) => shouldMigrate(i.url))
    stats.productImage.skipped = productImages.length - toMigrateI.length

    console.log(`  Total: ${productImages.length}  |  Para migrar: ${toMigrateI.length}  |  Já ok: ${stats.productImage.skipped}\n`)

    for (const img of toMigrateI) {
      process.stdout.write(`  [ProductImage] produto=${img.productId} ordem=${img.order} ... `)
      try {
        if (!DRY_RUN) {
          const url = await uploadToCloudinary(img.url, `products/gallery_${img.id}`)
          await prisma.productImage.update({ where: { id: img.id }, data: { url } })
          process.stdout.write(`✅ ${url}\n`)
        } else {
          process.stdout.write(`[dry-run]\n`)
        }
        stats.productImage.migrated++
      } catch (err) {
        process.stdout.write(`❌ ${err?.message || err}\n`)
        stats.productImage.failed++
      }
      await sleep(DELAY_MS)
    }

    // ── RESUMO ──────────────────────────────────────────────────────────────
    const totalMigrated = stats.mainImage.migrated + stats.productImage.migrated
    const totalFailed   = stats.mainImage.failed   + stats.productImage.failed

    console.log('\n════════════════════════════════════════════════════════════')
    console.log('  RESUMO')
    console.log('════════════════════════════════════════════════════════════')
    console.log(`  Product.mainImage   → ✅ ${stats.mainImage.migrated}  ⏭  ${stats.mainImage.skipped}  ❌ ${stats.mainImage.failed}`)
    console.log(`  ProductImage.url    → ✅ ${stats.productImage.migrated}  ⏭  ${stats.productImage.skipped}  ❌ ${stats.productImage.failed}`)
    console.log('────────────────────────────────────────────────────────────')
    console.log(`  Total migrados: ${totalMigrated}   Total falhas: ${totalFailed}`)

    if (DRY_RUN) {
      console.log('\n  ⚠️  Dry-run concluído. Nenhuma alteração foi feita.')
      console.log('  Rode sem --dry-run para aplicar a migração real.')
    } else if (totalFailed === 0) {
      console.log('\n  🎉 Concluído! Todas as imagens estão agora no Cloudinary.')
    } else {
      console.log(`\n  ⚠️  ${totalFailed} falha(s). Rode novamente — os já migrados serão ignorados.`)
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
