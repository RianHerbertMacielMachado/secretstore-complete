import { prisma } from '@/lib/prisma'
import AdminConfiguracoesClient from '@/components/admin/AdminConfiguracoesClient'

export const dynamic = 'force-dynamic'

export default async function AdminConfiguracoesPage() {
  const [configs, storeSettings] = await Promise.all([
    prisma.siteConfig.findMany(),
    prisma.storeSettings.findFirst(),
  ])

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  const envStatus = {
    mp: !!process.env.MP_ACCESS_TOKEN,
    paypal: !!process.env.PAYPAL_CLIENT_ID,
    picpay: !!process.env.PICPAY_TOKEN,
    google: !!process.env.GOOGLE_CLIENT_ID,
    discord: !!process.env.DISCORD_CLIENT_ID,
    drive: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    email: !!process.env.EMAIL_HOST,
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
  }

  const webhookBase = process.env.NEXTAUTH_URL || 'https://seudominio.com'

  // Parse socialLinks stored as JSON string
  let socialLinks: { id: string; network: string; url: string; label?: string }[] = []
  try {
    const raw = (storeSettings as any)?.socialLinks
    if (raw && typeof raw === 'string') {
      socialLinks = JSON.parse(raw)
    }
  } catch {}

  return (
    <AdminConfiguracoesClient
      configMap={configMap}
      envStatus={envStatus}
      webhookBase={webhookBase}
      discordUrl={storeSettings?.discordUrl ?? null}
      productsPerPage={storeSettings?.productsPerPage ?? 15}
      socialLinks={socialLinks}
    />
  )
}
