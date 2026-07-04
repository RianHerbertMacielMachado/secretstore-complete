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
]

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: POPUP_KEYS } },
    })
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))
    return NextResponse.json({
      enabled: map.popup_enabled === 'true',
      discount: map.popup_discount || '15',
      code: map.popup_code || '',
      expiryHours: parseInt(map.popup_expiry_hours || '24', 10),
      ctaText: map.popup_cta_text || 'RESGATAR OFERTA',
      ctaLink: map.popup_cta_link || '/',
      delaySeconds: parseInt(map.popup_delay_seconds || '3', 10),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
