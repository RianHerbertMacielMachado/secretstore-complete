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
  'popup_design',
  'popup_color_accent',
  'popup_color_text',
  'popup_color_bg',
  'popup_color_timer_bg',
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
      design: map.popup_design || 'classic',
      colors: {
        accentColor:  map.popup_color_accent   || '#dc2626',
        textColor:    map.popup_color_text     || '#ffffff',
        bgColor:      map.popup_color_bg       || '#0d0d0d',
        timerBg:      map.popup_color_timer_bg || '#1f1f1f',
      },
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
    const { enabled, discount, code, expiryHours, ctaText, ctaLink, delaySeconds, design, colors } = body

    const upserts = [
      { key: 'popup_enabled',        value: String(enabled ?? false) },
      { key: 'popup_discount',       value: String(discount || '15') },
      { key: 'popup_code',           value: String(code || '') },
      { key: 'popup_expiry_hours',   value: String(expiryHours || '24') },
      { key: 'popup_cta_text',       value: String(ctaText || 'RESGATAR OFERTA') },
      { key: 'popup_cta_link',       value: String(ctaLink || '/') },
      { key: 'popup_delay_seconds',  value: String(delaySeconds || '3') },
      { key: 'popup_design',         value: String(design || 'classic') },
      { key: 'popup_color_accent',   value: String(colors?.accentColor  || '#dc2626') },
      { key: 'popup_color_text',     value: String(colors?.textColor    || '#ffffff') },
      { key: 'popup_color_bg',       value: String(colors?.bgColor      || '#0d0d0d') },
      { key: 'popup_color_timer_bg', value: String(colors?.timerBg      || '#1f1f1f') },
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
