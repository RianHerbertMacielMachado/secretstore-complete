import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET público — retorna configurações do popup para o frontend
export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: POPUP_KEYS } },
    })
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return NextResponse.json({
      enabled:      map.popup_enabled === 'true',
      discount:     map.popup_discount || '15',
      code:         map.popup_code || '',
      expiryHours:  parseInt(map.popup_expiry_hours || '24', 10),
      ctaText:      map.popup_cta_text || 'RESGATAR OFERTA',
      ctaLink:      map.popup_cta_link || '/',
      delaySeconds: parseInt(map.popup_delay_seconds || '3', 10),
      design:       map.popup_design || 'classic',
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
