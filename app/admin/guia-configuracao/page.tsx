import { prisma } from '@/lib/prisma'
import GuiaConfiguracaoClient from '@/components/guia/GuiaConfiguracaoClient'

export const dynamic = 'force-dynamic'

async function getConfigStatus() {
  const configs = await prisma.siteConfig.findMany()
  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  
  // Verificar quais configs estão preenchidas (via env vars)
  const checks = {
    google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    discord_oauth: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
    mercadopago: !!(process.env.MP_ACCESS_TOKEN),
    paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    picpay: !!(process.env.PICPAY_TOKEN),
    google_drive: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
    email: !!(process.env.RESEND_API_KEY || (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)),
    cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    database: !!(process.env.DATABASE_URL),
    nextauth: !!(process.env.NEXTAUTH_SECRET),
    site_url: !!(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== 'http://localhost:3000'),
  }

  const configured = Object.values(checks).filter(Boolean).length
  const total = Object.keys(checks).length

  return { checks, configured, total, configMap }
}

export default async function GuiaConfiguracaoPage() {
  const status = await getConfigStatus()
  const siteUrl = process.env.NEXTAUTH_URL || 'https://seudominio.com'
  
  return <GuiaConfiguracaoClient status={status} siteUrl={siteUrl} />
}
