import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any)?.role === 'ADMIN'
}

// Chaves do SiteConfig usadas pelo popup
const POPUP_KEYS = [
  'popup_enabled',
  'popup_discount',
  'popup_code',
  'popup_expiry_hours',
  'popup_cta_text',
  'popup_cta_link',
  'popup_delay_seconds',
]

// GET — retorna configurações atuais do popup
export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: POPUP_KEYS } },
    })
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return NextResponse.json({
      enabled: map.popup_enabled === 'true',
      discount: map.popup_discount || '15',
      code: map.popup_code || '',
      expiryHours: map.popup_expiry_hours || '24',
      ctaText: map.popup_cta_text || 'RESGATAR OFERTA',
      ctaLink: map.popup_cta_link || '/',
      delaySeconds: map.popup_delay_seconds || '3',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT — salva configurações do popup
export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const body = await req.json()
    const { enabled, discount, code, expiryHours, ctaText, ctaLink, delaySeconds } = body

    const upserts = [
      { key: 'popup_enabled', value: String(enabled ?? false) },
      { key: 'popup_discount', value: String(discount || '15') },
      { key: 'popup_code', value: String(code || '') },
      { key: 'popup_expiry_hours', value: String(expiryHours || '24') },
      { key: 'popup_cta_text', value: String(ctaText || 'RESGATAR OFERTA') },
      { key: 'popup_cta_link', value: String(ctaLink || '/') },
      { key: 'popup_delay_seconds', value: String(delaySeconds || '3') },
    ]

    await Promise.all(
      upserts.map((cfg) =>
        prisma.siteConfig.upsert({
          where: { key: cfg.key },
          create: { key: cfg.key, value: cfg.value },
          update: { value: cfg.value },
        })
      )
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
